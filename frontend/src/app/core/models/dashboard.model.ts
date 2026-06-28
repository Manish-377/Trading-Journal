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
