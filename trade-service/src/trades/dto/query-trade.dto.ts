import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { TradeStatus, TradeType } from '../../common/enums/trade.enum';

export class QueryTradeDto {
  @IsOptional()
  @IsEnum(TradeStatus)
  status?: TradeStatus;

  @IsOptional()
  @IsEnum(TradeType)
  tradeType?: TradeType;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsString()
  strategyId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
