import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@Request() req) {
    return this.dashboardService.getOverview(req.user.userId);
  }

  @Get('daily-pnl')
  getDailyPnl(@Request() req) {
    return this.dashboardService.getDailyPnl(req.user.userId);
  }

  @Get('symbols')
  getSymbolBreakdown(@Request() req) {
    return this.dashboardService.getSymbolBreakdown(req.user.userId);
  }

  @Get('strategies')
  getStrategyPerformance(@Request() req) {
    return this.dashboardService.getStrategyPerformance(req.user.userId);
  }
}
