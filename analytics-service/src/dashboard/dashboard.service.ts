import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface DashboardStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  totalPnl: number;
  largestWin: number;
  largestLoss: number;
  averagePnl: number;
  profitFactor: number;
}

export interface DailyPnl {
  date: string;
  pnl: number;
  cumulative: number;
}

export interface SymbolBreakdown {
  symbol: string;
  count: number;
}

export interface StrategyPerformance {
  strategyId: string;
  tradeCount: number;
  pnl: number;
}

@Injectable()
export class DashboardService {
  constructor(private redis: RedisService) {}

  async getOverview(userId: string): Promise<DashboardStats> {
    const key = `analytics:${userId}`;
    const data = await this.redis.hgetall(key);

    const totalTrades = parseInt(data.totalTrades || '0');
    const openTrades = parseInt(data.openTrades || '0');
    const closedTrades = parseInt(data.closedTrades || '0');
    const wins = parseInt(data.wins || '0');
    const losses = parseInt(data.losses || '0');
    const breakeven = parseInt(data.breakeven || '0');
    const totalPnl = parseFloat(data.totalPnl || '0');
    const largestWin = parseFloat(data.largestWin || '0');
    const largestLoss = parseFloat(data.largestLoss || '0');

    const winRate = closedTrades > 0 ? (wins / closedTrades) * 100 : 0;
    const averagePnl = closedTrades > 0 ? totalPnl / closedTrades : 0;

    // Profit factor: gross wins / gross losses (absolute)
    const profitFactor = Math.abs(largestLoss) > 0
      ? Math.abs(totalPnl > 0 ? totalPnl : 0) / Math.abs(largestLoss)
      : 0;

    return {
      totalTrades,
      openTrades,
      closedTrades,
      wins,
      losses,
      breakeven,
      winRate: Math.round(winRate * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      largestWin: Math.round(largestWin * 100) / 100,
      largestLoss: Math.round(largestLoss * 100) / 100,
      averagePnl: Math.round(averagePnl * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
    };
  }

  async getDailyPnl(userId: string): Promise<DailyPnl[]> {
    const dailyKey = `analytics:${userId}:daily`;
    const data = await this.redis.hgetall(dailyKey);

    const entries = Object.entries(data)
      .map(([date, pnl]) => ({ date, pnl: parseFloat(pnl) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let cumulative = 0;
    return entries.map((entry) => {
      cumulative += entry.pnl;
      return {
        date: entry.date,
        pnl: Math.round(entry.pnl * 100) / 100,
        cumulative: Math.round(cumulative * 100) / 100,
      };
    });
  }

  async getSymbolBreakdown(userId: string): Promise<SymbolBreakdown[]> {
    const symbolKey = `analytics:${userId}:symbols`;
    const data = await this.redis.hgetall(symbolKey);

    return Object.entries(data)
      .map(([symbol, count]) => ({ symbol, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count);
  }

  async getStrategyPerformance(userId: string): Promise<StrategyPerformance[]> {
    const stratKey = `analytics:${userId}:strategies`;
    const stratPnlKey = `analytics:${userId}:strategy_pnl`;

    const counts = await this.redis.hgetall(stratKey);
    const pnls = await this.redis.hgetall(stratPnlKey);

    const strategyIds = new Set([...Object.keys(counts), ...Object.keys(pnls)]);

    return Array.from(strategyIds).map((strategyId) => ({
      strategyId,
      tradeCount: parseInt(counts[strategyId] || '0'),
      pnl: Math.round(parseFloat(pnls[strategyId] || '0') * 100) / 100,
    }));
  }
}
