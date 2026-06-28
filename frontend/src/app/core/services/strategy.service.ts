import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Strategy, CreateStrategyPayload, UpdateStrategyPayload } from '../models/strategy.model';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StrategyService {
  private readonly API_URL = `${environment.apiUrl}/api/strategies`;

  constructor(private http: HttpClient) {}

  getAll(activeOnly?: boolean): Observable<Strategy[]> {
    const params: any = {};
    if (activeOnly !== undefined) params.active = String(activeOnly);
    return this.http.get<Strategy[]>(this.API_URL, { params });
  }

  getOne(id: string): Observable<Strategy> {
    return this.http.get<Strategy>(`${this.API_URL}/${id}`);
  }

  create(payload: CreateStrategyPayload): Observable<Strategy> {
    return this.http.post<Strategy>(this.API_URL, payload);
  }

  update(id: string, payload: UpdateStrategyPayload): Observable<Strategy> {
    return this.http.put<Strategy>(`${this.API_URL}/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
