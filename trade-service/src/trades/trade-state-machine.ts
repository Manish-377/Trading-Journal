import { BadRequestException } from '@nestjs/common';
import { TradeStatus } from '../common/enums/trade.enum';

const TRANSITIONS: Record<TradeStatus, TradeStatus[]> = {
  [TradeStatus.OPEN]: [TradeStatus.CLOSED],
  [TradeStatus.CLOSED]: [TradeStatus.REVIEWED],
  [TradeStatus.REVIEWED]: [],
};

export class TradeStateMachine {
  static canTransition(from: TradeStatus, to: TradeStatus): boolean {
    return TRANSITIONS[from].includes(to);
  }

  static transition(currentStatus: TradeStatus, targetStatus: TradeStatus): TradeStatus {
    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${targetStatus}`,
      );
    }
    return targetStatus;
  }

  static getAllowedTransitions(status: TradeStatus): TradeStatus[] {
    return TRANSITIONS[status];
  }
}
