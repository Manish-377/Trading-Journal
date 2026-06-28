import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trade, TradeListResponse, CreateTradePayload } from '../models/trade.model';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TradeService {
  private readonly API_URL = environment.tradeUrl ? `${environment.tradeUrl}/trades` : `${environment.apiUrl}/api/trades`;

  constructor(private http: HttpClient) {}

  getAll(filters?: Record<string, string>): Observable<TradeListResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params = params.set(key, val);
      });
    }
    return this.http.get<TradeListResponse>(this.API_URL, { params });
  }

  getOne(id: string): Observable<Trade> {
    return this.http.get<Trade>(`${this.API_URL}/${id}`);
  }

  create(payload: CreateTradePayload): Observable<Trade> {
    return this.http.post<Trade>(this.API_URL, payload);
  }

  update(id: string, payload: Partial<CreateTradePayload>): Observable<Trade> {
    return this.http.put<Trade>(`${this.API_URL}/${id}`, payload);
  }

  close(id: string, exitPrice: number, closedAt?: string): Observable<Trade> {
    return this.http.put<Trade>(`${this.API_URL}/${id}/close`, { exitPrice, closedAt });
  }

  review(id: string, notes?: string): Observable<Trade> {
    return this.http.put<Trade>(`${this.API_URL}/${id}/review`, { notes });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  uploadImage(tradeId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.API_URL}/${tradeId}/images`, formData);
  }

  deleteImage(tradeId: string, imageId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${tradeId}/images/${imageId}`);
  }

  getInsights(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/analysis/insights`);
  }

  importTrades(trades: any[]): Observable<{ imported: number; failed: number; errors: string[] }> {
    return this.http.post<{ imported: number; failed: number; errors: string[] }>(
      `${this.API_URL}/import`, { trades }
    );
  }
}
