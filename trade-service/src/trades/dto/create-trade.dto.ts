import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';
import { TradeType, Direction } from '../../common/enums/trade.enum';

export class CreateTradeDto {
  @IsNotEmpty()
  @IsString()
  symbol: string;

  @IsEnum(TradeType)
  tradeType: TradeType;

  @IsEnum(Direction)
  direction: Direction;

  @IsNumber()
  entryPrice: number;

  @IsOptional()
  @IsNumber()
  exitPrice?: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  takeProfit?: number;

  @IsOptional()
  @IsNumber()
  fees?: number;

  @IsOptional()
  @IsString()
  strategyId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsDateString()
  openedAt: string;

  @IsOptional()
  @IsDateString()
  closedAt?: string;
}
