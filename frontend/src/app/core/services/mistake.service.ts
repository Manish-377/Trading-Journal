import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mistake, CreateMistakePayload, UpdateMistakePayload, MistakeStats } from '../models/mistake.model';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MistakeService {
  private readonly API_URL = `${environment.apiUrl}/api/mistakes`;

  constructor(private http: HttpClient) {}

  getAll(params?: { category?: string; severity?: string; tradeId?: string; strategyId?: string }): Observable<Mistake[]> {
    return this.http.get<Mistake[]>(this.API_URL, { params: params as any });
  }

  getOne(id: string): Observable<Mistake> {
    return this.http.get<Mistake>(`${this.API_URL}/${id}`);
  }

  getStats(): Observable<MistakeStats> {
    return this.http.get<MistakeStats>(`${this.API_URL}/stats`);
  }

  create(payload: CreateMistakePayload): Observable<Mistake> {
    return this.http.post<Mistake>(this.API_URL, payload);
  }

  update(id: string, payload: UpdateMistakePayload): Observable<Mistake> {
    return this.http.put<Mistake>(`${this.API_URL}/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
