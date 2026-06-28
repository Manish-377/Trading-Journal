import { IsString, IsOptional, IsEnum, IsUUID, MinLength } from 'class-validator';
import { MistakeCategory, Severity } from './create-mistake.dto';

export class UpdateMistakeDto {
  @IsOptional()
  @IsEnum(MistakeCategory)
  category?: MistakeCategory;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsString()
  lesson?: string;

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
