import { Direction, TradeType } from '../common/enums/trade.enum';

export interface PnLInput {
  tradeType: TradeType;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees: number;
}

export interface PnLResult {
  pnl: number;
  riskRewardRatio: number | null;
}

// Strategy Pattern interface
interface PnLCalculator {
  calculate(input: PnLInput): PnLResult;
}

class EquityCalculator implements PnLCalculator {
  calculate(input: PnLInput): PnLResult {
    const { direction, entryPrice, exitPrice, quantity, fees } = input;
    const pnl =
      direction === Direction.LONG
        ? (exitPrice - entryPrice) * quantity - fees
        : (entryPrice - exitPrice) * quantity - fees;

    return { pnl: Math.round(pnl * 100) / 100, riskRewardRatio: null };
  }
}

class OptionsCalculator implements PnLCalculator {
  private readonly lotSize = 100; // standard options contract

  calculate(input: PnLInput): PnLResult {
    const { direction, entryPrice, exitPrice, quantity, fees } = input;
    const pnl =
      direction === Direction.LONG
        ? (exitPrice - entryPrice) * quantity * this.lotSize - fees
        : (entryPrice - exitPrice) * quantity * this.lotSize - fees;

    return { pnl: Math.round(pnl * 100) / 100, riskRewardRatio: null };
  }
}

class FuturesCalculator implements PnLCalculator {
  private readonly contractMultiplier = 50; // e.g., ES mini

  calculate(input: PnLInput): PnLResult {
    const { direction, entryPrice, exitPrice, quantity, fees } = input;
    const pnl =
      direction === Direction.LONG
        ? (exitPrice - entryPrice) * quantity * this.contractMultiplier - fees
        : (entryPrice - exitPrice) * quantity * this.contractMultiplier - fees;

    return { pnl: Math.round(pnl * 100) / 100, riskRewardRatio: null };
  }
}

// Forex, Crypto, Commodity, Index all use simple price * quantity calculation (like equity)
class SimpleCalculator implements PnLCalculator {
  calculate(input: PnLInput): PnLResult {
    const { direction, entryPrice, exitPrice, quantity, fees } = input;
    const pnl =
      direction === Direction.LONG
        ? (exitPrice - entryPrice) * quantity - fees
        : (entryPrice - exitPrice) * quantity - fees;

    return { pnl: Math.round(pnl * 100) / 100, riskRewardRatio: null };
  }
}

// Factory
export class PnLCalculatorFactory {
  private static calculators: Record<TradeType, PnLCalculator> = {
    [TradeType.EQUITY]: new EquityCalculator(),
    [TradeType.OPTIONS]: new OptionsCalculator(),
    [TradeType.FUTURES]: new FuturesCalculator(),
    [TradeType.FOREX]: new SimpleCalculator(),
    [TradeType.CRYPTO]: new SimpleCalculator(),
    [TradeType.COMMODITY]: new SimpleCalculator(),
    [TradeType.INDEX]: new SimpleCalculator(),
  };

  static calculate(input: PnLInput): PnLResult {
    const calculator = this.calculators[input.tradeType];
    return calculator.calculate(input);
  }
}
