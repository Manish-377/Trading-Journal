import { Module } from '@nestjs/common';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { TradeAnalysisService } from './trade-analysis.service';

@Module({
  controllers: [TradesController],
  providers: [TradesService, TradeAnalysisService],
  exports: [TradesService],
})
export class TradesModule {}
