import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject, filter, take, switchMap } from 'rxjs';
import { User, AuthResponse, TokenResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/api/auth`;
  private accessToken = signal<string | null>(null);
  private currentUser = signal<User | null>(null);
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessToken());

  constructor(private http: HttpClient, private router: Router) {
    this.loadTokenFromStorage();
  }

  signup(email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/signup`, { email, password, name }).pipe(
      tap(res => this.handleAuthResponse(res)),
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(res => this.handleAuthResponse(res)),
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe();
    }
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<TokenResponse> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => {
          return new Observable<TokenResponse>(subscriber => {
            subscriber.next({ accessToken: this.accessToken()!, refreshToken: this.getRefreshToken()! });
            subscriber.complete();
          });
        }),
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const refreshToken = this.getRefreshToken();
    return this.http.post<TokenResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(res => {
        this.accessToken.set(res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('accessToken', res.accessToken);
        this.isRefreshing = false;
        this.refreshTokenSubject.next(res.accessToken);
      }),
      catchError(err => {
        this.isRefreshing = false;
        this.clearAuth();
        this.router.navigate(['/login']);
        return throwError(() => err);
      }),
    );
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private handleAuthResponse(res: AuthResponse): void {
    this.accessToken.set(res.accessToken);
    this.currentUser.set(res.user);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  private clearAuth(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  private loadTokenFromStorage(): void {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      this.accessToken.set(storedToken);
    }
    if (storedUser) {
      try {
        this.currentUser.set(JSON.parse(storedUser));
      } catch { /* ignore parse errors */ }
    }
  }
}
