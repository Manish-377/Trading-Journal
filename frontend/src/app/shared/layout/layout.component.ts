import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { CandleBgComponent } from '../candle-bg/candle-bg.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatIconModule, MatButtonModule, MatDividerModule,
    CandleBgComponent,
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav mode="side" opened class="sidebar">
        <div class="logo">
          <mat-icon class="logo-icon">candlestick_chart</mat-icon>
          <span class="logo-text">Trading Journal</span>
        </div>

        <mat-divider></mat-divider>

        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a routerLink="/trades" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <mat-icon>show_chart</mat-icon>
            <span>Trades</span>
          </a>
          <a routerLink="/trades/new" routerLinkActive="active" class="nav-item">
            <mat-icon>add_circle</mat-icon>
            <span>New Trade</span>
          </a>
          <a routerLink="/strategies" routerLinkActive="active" class="nav-item">
            <mat-icon>psychology</mat-icon>
            <span>Strategies</span>
          </a>
          <a routerLink="/mistakes" routerLinkActive="active" class="nav-item">
            <mat-icon>analytics</mat-icon>
            <span>Analysis</span>
          </a>
        </nav>

        <div class="spacer"></div>

        <mat-divider></mat-divider>

        <div class="user-section">
          @if (authService.user(); as user) {
            <div class="user-info">
              <div class="user-avatar">{{ getInitials(user.name) }}</div>
              <span class="username">{{ user.name }}</span>
            </div>
          }
          <button mat-stroked-button class="logout-btn" (click)="authService.logout()">
            <mat-icon>logout</mat-icon> Logout
          </button>
          <p class="sidebar-slogan">made by <span class="slogan-hl">trader</span>, for <span class="slogan-hl">traders</span></p>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="content">
        <app-candle-bg [opacity]="0.07"></app-candle-bg>
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container {
      height: 100vh;
    }

    .sidebar {
      width: 250px;
      background: #0a0f1a !important;
      border-right: 1px solid #1e2d3d !important;
      padding: 1.25rem 0;
    }

    .logo {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.5rem 1.25rem; margin-bottom: 1rem;
    }
    .logo-icon { color: #0ea5e9; font-size: 28px; width: 28px; height: 28px; }
    .logo-text { color: #c7e2f7; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.3px; }

    mat-divider { border-top-color: #1e2d3d !important; }

    .nav-links {
      display: flex; flex-direction: column; gap: 0.25rem;
      padding: 0.5rem 0.75rem;
    }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      color: #8899a8; text-decoration: none; padding: 0.7rem 1rem;
      border-radius: 8px; font-size: 0.9rem; transition: all 0.15s;
    }
    .nav-item mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .nav-item:hover { background: rgba(14, 165, 233, 0.08); color: #c7e2f7; }
    .nav-item.active { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; font-weight: 500; }
    .nav-item.active mat-icon { color: #0ea5e9; }

    .spacer { flex: 1; }

    .sidebar-slogan {
      text-align: center; color: #3a4858; font-size: 0.7rem;
      font-style: italic; letter-spacing: 1.5px;
      margin: 1rem 0 0;
    }
    .slogan-hl { color: #0ea5e9; font-weight: 600; }

    .user-section {
      padding: 1rem 1.25rem 0.5rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .user-info {
      display: flex; align-items: center; gap: 0.5rem;
      color: #c7e2f7; font-size: 0.85rem;
    }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.75rem; font-weight: 700;
      letter-spacing: 0.5px;
    }
    .logout-btn { font-size: 0.8rem; color: #8899a8; border-color: #1e2d3d; }
    .logout-btn:hover { border-color: #5a6472; color: #c7e2f7; }

    .content {
      background: #0b1220;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
  `],
})
export class LayoutComponent {
  constructor(public authService: AuthService) {}

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
