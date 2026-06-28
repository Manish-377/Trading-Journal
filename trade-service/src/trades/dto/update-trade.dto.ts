import {
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';

export class UpdateTradeDto {
  @IsOptional()
  @IsNumber()
  entryPrice?: number;

  @IsOptional()
  @IsNumber()
  exitPrice?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

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

  @IsOptional()
  @IsDateString()
  closedAt?: string;
}
