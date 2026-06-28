export type MistakeCategory =
  | 'FOMO'
  | 'OVERTRADING'
  | 'NO_STOP_LOSS'
  | 'MOVED_STOP_LOSS'
  | 'EARLY_EXIT'
  | 'LATE_ENTRY'
  | 'REVENGE_TRADE'
  | 'POSITION_SIZE'
  | 'IGNORED_RULES'
  | 'EMOTIONAL'
  | 'OTHER';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Mistake {
  id: string;
  userId: string;
  category: MistakeCategory;
  description: string;
  lesson: string | null;
  severity: Severity;
  tradeId: string | null;
  strategyId: string | null;
  trade: { id: string; symbol: string } | null;
  strategy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMistakePayload {
  category: MistakeCategory;
  description: string;
  lesson?: string;
  severity?: Severity;
  tradeId?: string;
  strategyId?: string;
}

export type UpdateMistakePayload = Partial<CreateMistakePayload>;

export interface MistakeStats {
  total: number;
  byCategory: { category: MistakeCategory; _count: { id: number } }[];
  bySeverity: { severity: Severity; _count: { id: number } }[];
}
