export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  rules: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { trades: number; mistakes: number };
}

export interface CreateStrategyPayload {
  name: string;
  description?: string;
  rules?: string[];
  tags?: string[];
  isActive?: boolean;
}

export type UpdateStrategyPayload = Partial<CreateStrategyPayload>;
