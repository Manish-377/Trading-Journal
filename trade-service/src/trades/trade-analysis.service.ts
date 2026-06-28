import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TradeMistakeSuggestion {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  tradeIds: string[];
}

@Injectable()
export class TradeAnalysisService {
  constructor(private prisma: PrismaService) {}

  async analyzeTrades(userId: string): Promise<TradeMistakeSuggestion[]> {
    const rawTrades = await this.prisma.trade.findMany({
      where: { userId, status: 'CLOSED' },
      orderBy: { closedAt: 'desc' },
      take: 50,
    });

    // Convert Prisma Decimal fields to plain numbers
    const trades = rawTrades.map(t => ({
      ...t,
      pnl: t.pnl !== null ? Number(t.pnl) : null,
      entryPrice: Number(t.entryPrice),
      exitPrice: t.exitPrice !== null ? Number(t.exitPrice) : null,
      stopLoss: t.stopLoss !== null ? Number(t.stopLoss) : null,
      takeProfit: t.takeProfit !== null ? Number(t.takeProfit) : null,
      quantity: Number(t.quantity),
    }));

    if (trades.length < 3) {
      return [];
    }

    const suggestions: TradeMistakeSuggestion[] = [];

    // 1. No stop loss detection
    const noStopLoss = trades.filter(t => !t.stopLoss && t.pnl !== null && t.pnl < 0);
    if (noStopLoss.length >= 2) {
      suggestions.push({
        category: 'NO_STOP_LOSS',
        severity: noStopLoss.length >= 5 ? 'HIGH' : 'MEDIUM',
        description: `${noStopLoss.length} losing trades had no stop loss set. Always define your risk before entering.`,
        tradeIds: noStopLoss.slice(0, 5).map(t => t.id),
      });
    }

    // 2. Revenge trading - consecutive losses with increasing position size
    const revengeTrades: string[] = [];
    for (let i = 1; i < trades.length; i++) {
      const prev = trades[i - 1];
      const curr = trades[i];
      if (
        prev.pnl !== null && prev.pnl < 0 &&
        curr.pnl !== null && curr.pnl < 0 &&
        curr.quantity > prev.quantity * 1.3 &&
        prev.closedAt && curr.openedAt &&
        (new Date(curr.openedAt).getTime() - new Date(prev.closedAt).getTime()) < 2 * 60 * 60 * 1000
      ) {
        revengeTrades.push(curr.id);
      }
    }
    if (revengeTrades.length >= 1) {
      suggestions.push({
        category: 'REVENGE_TRADE',
        severity: revengeTrades.length >= 3 ? 'CRITICAL' : 'HIGH',
        description: `${revengeTrades.length} trade(s) appear to be revenge trades — larger positions taken shortly after losses.`,
        tradeIds: revengeTrades.slice(0, 5),
      });
    }

    // 3. Overtrading - too many trades in a single day (includes open trades)
    const allRecentTrades = await this.prisma.trade.findMany({
      where: { userId },
      select: { id: true, openedAt: true },
      orderBy: { openedAt: 'desc' },
      take: 100,
    });
    const tradeDays: Record<string, string[]> = {};
    for (const t of allRecentTrades) {
      if (t.openedAt) {
        const day = new Date(t.openedAt).toISOString().slice(0, 10);
        if (!tradeDays[day]) tradeDays[day] = [];
        tradeDays[day].push(t.id);
      }
    }
    const overtradedDays = Object.entries(tradeDays).filter(([, ids]) => ids.length >= 5);
    if (overtradedDays.length >= 1) {
      const allIds = overtradedDays.flatMap(([, ids]) => ids);
      suggestions.push({
        category: 'OVERTRADING',
        severity: overtradedDays.length >= 3 ? 'HIGH' : 'MEDIUM',
        description: `${overtradedDays.length} day(s) with 5+ trades detected. Overtrading often leads to impulsive decisions.`,
        tradeIds: allIds.slice(0, 5),
      });
    }

    // 4. Early exits - trades closed with small profit while having a take profit far away
    const earlyExits = trades.filter(t => {
      if (!t.takeProfit || !t.exitPrice || !t.pnl || t.pnl <= 0) return false;
      const targetMove = Math.abs(t.takeProfit - t.entryPrice);
      const actualMove = Math.abs(t.exitPrice - t.entryPrice);
      return actualMove < targetMove * 0.4; // exited at less than 40% of target
    });
    if (earlyExits.length >= 2) {
      suggestions.push({
        category: 'EARLY_EXIT',
        severity: 'MEDIUM',
        description: `${earlyExits.length} winning trades were closed well before reaching take profit. Consider letting winners run.`,
        tradeIds: earlyExits.slice(0, 5).map(t => t.id),
      });
    }

    // 5. Position sizing - large losses relative to average
    const closedWithPnl = trades.filter(t => t.pnl !== null);
    if (closedWithPnl.length >= 5) {
      const avgLoss = closedWithPnl
        .filter(t => t.pnl! < 0)
        .reduce((sum, t) => sum + Math.abs(t.pnl!), 0) / (closedWithPnl.filter(t => t.pnl! < 0).length || 1);

      const oversizedLosses = closedWithPnl.filter(t => t.pnl! < 0 && Math.abs(t.pnl!) > avgLoss * 2.5);
      if (oversizedLosses.length >= 1) {
        suggestions.push({
          category: 'POSITION_SIZE',
          severity: oversizedLosses.length >= 3 ? 'HIGH' : 'MEDIUM',
          description: `${oversizedLosses.length} trade(s) had losses 2.5x larger than your average loss. Review position sizing rules.`,
          tradeIds: oversizedLosses.slice(0, 5).map(t => t.id),
        });
      }
    }

    // 6. FOMO - entering right after a big winner with same symbol
    const fomoTrades: string[] = [];
    for (let i = 1; i < trades.length; i++) {
      const prev = trades[i - 1];
      const curr = trades[i];
      if (
        prev.pnl !== null && prev.pnl > 0 &&
        curr.symbol === prev.symbol &&
        curr.pnl !== null && curr.pnl < 0 &&
        prev.closedAt && curr.openedAt &&
        (new Date(curr.openedAt).getTime() - new Date(prev.closedAt).getTime()) < 30 * 60 * 1000
      ) {
        fomoTrades.push(curr.id);
      }
    }
    if (fomoTrades.length >= 1) {
      suggestions.push({
        category: 'FOMO',
        severity: 'MEDIUM',
        description: `${fomoTrades.length} losing trade(s) were opened on the same symbol within 30 min of a win. Possible FOMO re-entry.`,
        tradeIds: fomoTrades.slice(0, 5),
      });
    }

    return suggestions.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}
