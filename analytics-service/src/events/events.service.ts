import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from '../redis/redis.service';

export interface TradeEvent {
  type: 'TRADE_CREATED' | 'TRADE_CLOSED' | 'TRADE_UPDATED';
  userId: string;
  trade: {
    id: string;
    symbol: string;
    tradeType: string;
    direction: string;
    entryPrice: number;
    exitPrice?: number;
    quantity: number;
    fees: number;
    pnl?: number;
    status: string;
    strategyId?: string;
    openedAt: string;
    closedAt?: string;
  };
}

@Injectable()
export class EventsService implements OnModuleInit {
  private subscriber: Redis;
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.subscriber = new Redis(redisUrl);
    } else {
      this.subscriber = new Redis({
        host: this.config.get('REDIS_HOST', 'localhost'),
        port: this.config.get('REDIS_PORT', 6379),
      });
    }

    this.subscriber.subscribe('trade_events', (err) => {
      if (err) {
        this.logger.error('Failed to subscribe to trade_events', err);
      } else {
        this.logger.log('Subscribed to trade_events channel');
      }
    });

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'trade_events') {
        this.handleTradeEvent(JSON.parse(message));
      }
    });
  }

  private async handleTradeEvent(event: TradeEvent) {
    this.logger.log(`Received event: ${event.type} for user ${event.userId}`);

    switch (event.type) {
      case 'TRADE_CREATED':
        await this.onTradeCreated(event);
        break;
      case 'TRADE_CLOSED':
        await this.onTradeClosed(event);
        break;
      case 'TRADE_UPDATED':
        await this.invalidateCache(event.userId);
        break;
    }
  }

  private async onTradeCreated(event: TradeEvent) {
    const key = `analytics:${event.userId}`;
    await this.redis.hincrby(key, 'totalTrades', 1);
    await this.redis.hincrby(key, 'openTrades', 1);

    // Track by symbol
    const symbolKey = `analytics:${event.userId}:symbols`;
    await this.redis.hincrby(symbolKey, event.trade.symbol, 1);

    // Track by strategy
    if (event.trade.strategyId) {
      const stratKey = `analytics:${event.userId}:strategies`;
      await this.redis.hincrby(stratKey, event.trade.strategyId, 1);
    }
  }

  private async onTradeClosed(event: TradeEvent) {
    const key = `analytics:${event.userId}`;
    await this.redis.hincrby(key, 'openTrades', -1);
    await this.redis.hincrby(key, 'closedTrades', 1);

    const pnl = parseFloat(String(event.trade.pnl || 0));
    await this.redis.hincrbyfloat(key, 'totalPnl', pnl);

    if (pnl > 0) {
      await this.redis.hincrby(key, 'wins', 1);
    } else if (pnl < 0) {
      await this.redis.hincrby(key, 'losses', 1);
    } else {
      await this.redis.hincrby(key, 'breakeven', 1);
    }

    // Track largest win/loss
    const currentLargestWin = parseFloat(await this.redis.hget(key, 'largestWin') || '0');
    const currentLargestLoss = parseFloat(await this.redis.hget(key, 'largestLoss') || '0');

    if (pnl > currentLargestWin) {
      await this.redis.hset(key, 'largestWin', pnl.toString());
    }
    if (pnl < currentLargestLoss) {
      await this.redis.hset(key, 'largestLoss', pnl.toString());
    }

    // Track daily P&L
    const day = event.trade.closedAt
      ? event.trade.closedAt.substring(0, 10)
      : new Date().toISOString().substring(0, 10);
    const dailyKey = `analytics:${event.userId}:daily`;
    await this.redis.hincrbyfloat(dailyKey, day, pnl);

    // Track by strategy P&L
    if (event.trade.strategyId) {
      const stratPnlKey = `analytics:${event.userId}:strategy_pnl`;
      await this.redis.hincrbyfloat(stratPnlKey, event.trade.strategyId, pnl);
    }
  }

  private async invalidateCache(userId: string) {
    // On updates, we clear cached computed values so they get recalculated
    await this.redis.del(`analytics:${userId}:computed`);
  }
}
