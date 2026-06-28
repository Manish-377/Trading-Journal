export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  tradeType: 'EQUITY' | 'OPTIONS' | 'FUTURES';
  direction: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED' | 'REVIEWED';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number | null;
  fees: number;
  riskRewardRatio: number | null;
  strategyId: string | null;
  notes: string | null;
  tags: string[];
  openedAt: string;
  closedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: TradeImage[];
}

export interface TradeImage {
  id: string;
  tradeId: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface TradeListResponse {
  data: Trade[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateTradePayload {
  symbol: string;
  tradeType: 'EQUITY' | 'OPTIONS' | 'FUTURES';
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  fees?: number;
  strategyId?: string;
  notes?: string;
  tags?: string[];
  openedAt: string;
  closedAt?: string;
}
