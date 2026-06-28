import { IsString, IsOptional, IsEnum, IsUUID, MinLength } from 'class-validator';

export enum MistakeCategory {
  FOMO = 'FOMO',
  OVERTRADING = 'OVERTRADING',
  NO_STOP_LOSS = 'NO_STOP_LOSS',
  MOVED_STOP_LOSS = 'MOVED_STOP_LOSS',
  EARLY_EXIT = 'EARLY_EXIT',
  LATE_ENTRY = 'LATE_ENTRY',
  REVENGE_TRADE = 'REVENGE_TRADE',
  POSITION_SIZE = 'POSITION_SIZE',
  IGNORED_RULES = 'IGNORED_RULES',
  EMOTIONAL = 'EMOTIONAL',
  OTHER = 'OTHER',
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateMistakeDto {
  @IsEnum(MistakeCategory)
  category: MistakeCategory;

  @IsString()
  @MinLength(5)
  description: string;

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
