import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { MistakeCategory, Severity } from './create-mistake.dto';

export class QueryMistakeDto {
  @IsOptional()
  @IsEnum(MistakeCategory)
  category?: MistakeCategory;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsUUID()
  tradeId?: string;

  @IsOptional()
  @IsUUID()
  strategyId?: string;
}
