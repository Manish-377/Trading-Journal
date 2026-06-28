import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.publisher = new Redis(redisUrl);
    } else {
      this.publisher = new Redis({
        host: this.config.get('REDIS_HOST', 'localhost'),
        port: this.config.get('REDIS_PORT', 6379),
      });
    }
    this.logger.log('Redis publisher connected');
  }

  onModuleDestroy() {
    this.publisher?.disconnect();
  }

  async publishTradeCreated(userId: string, trade: any) {
    await this.publish({
      type: 'TRADE_CREATED',
      userId,
      trade: this.serializeTrade(trade),
    });
  }

  async publishTradeClosed(userId: string, trade: any) {
    await this.publish({
      type: 'TRADE_CLOSED',
      userId,
      trade: this.serializeTrade(trade),
    });
  }

  async publishTradeUpdated(userId: string, trade: any) {
    await this.publish({
      type: 'TRADE_UPDATED',
      userId,
      trade: this.serializeTrade(trade),
    });
  }

  private async publish(event: any) {
    try {
      await this.publisher.publish('trade_events', JSON.stringify(event));
      this.logger.log(`Published ${event.type} for user ${event.userId}`);
    } catch (err) {
      this.logger.error('Failed to publish event', err);
    }
  }

  private serializeTrade(trade: any) {
    return {
      id: trade.id,
      symbol: trade.symbol,
      tradeType: trade.tradeType,
      direction: trade.direction,
      entryPrice: parseFloat(trade.entryPrice) || 0,
      exitPrice: trade.exitPrice ? parseFloat(trade.exitPrice) : undefined,
      quantity: parseFloat(trade.quantity) || 0,
      fees: parseFloat(trade.fees) || 0,
      pnl: trade.pnl ? parseFloat(trade.pnl) : 0,
      status: trade.status,
      strategyId: trade.strategyId,
      openedAt: trade.openedAt,
      closedAt: trade.closedAt,
    };
  }
}
