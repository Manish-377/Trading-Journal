import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats, DailyPnl, SymbolBreakdown, StrategyPerformance } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private baseUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getOverview(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/overview`);
  }

  getDailyPnl(): Observable<DailyPnl[]> {
    return this.http.get<DailyPnl[]>(`${this.baseUrl}/daily-pnl`);
  }

  getSymbolBreakdown(): Observable<SymbolBreakdown[]> {
    return this.http.get<SymbolBreakdown[]>(`${this.baseUrl}/symbols`);
  }

  getStrategyPerformance(): Observable<StrategyPerformance[]> {
    return this.http.get<StrategyPerformance[]>(`${this.baseUrl}/strategies`);
  }
}
