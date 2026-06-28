import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StrategyService } from '../../../core/services/strategy.service';
import { Strategy } from '../../../core/models/strategy.model';

@Component({
  selector: 'app-strategy-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Strategies</h1>
        <a routerLink="/strategies/new" mat-raised-button color="primary">
          <mat-icon>add</mat-icon> New Strategy
        </a>
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (strategies().length === 0) {
        <mat-card class="empty-card">
          <mat-icon class="empty-icon">psychology</mat-icon>
          <p>No strategies yet. Define your trading strategies to track performance.</p>
          <a routerLink="/strategies/new" mat-raised-button color="primary">Create your first strategy</a>
        </mat-card>
      } @else {
        <div class="grid">
          @for (strategy of strategies(); track strategy.id) {
            <mat-card class="strategy-card" [class.inactive]="!strategy.isActive" [routerLink]="['/strategies', strategy.id]">
              <div class="card-header">
                <h3>{{ strategy.name }}</h3>
                <span class="status-chip" [class.active]="strategy.isActive" [class.inactive-chip]="!strategy.isActive">
                  {{ strategy.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              @if (strategy.description) {
                <p class="description">{{ strategy.description }}</p>
              }
              @if (strategy.rules.length > 0) {
                <div class="rules">
                  <span class="rules-label">Rules:</span>
                  <ul>
                    @for (rule of strategy.rules.slice(0, 3); track rule) {
                      <li>{{ rule }}</li>
                    }
                    @if (strategy.rules.length > 3) {
                      <li class="more">+{{ strategy.rules.length - 3 }} more</li>
                    }
                  </ul>
                </div>
              }
              <div class="card-footer">
                <div class="stats">
                  <mat-icon class="stat-icon">show_chart</mat-icon>
                  <span>{{ strategy._count?.trades || 0 }} trades</span>
                  <mat-icon class="stat-icon">warning</mat-icon>
                  <span>{{ strategy._count?.mistakes || 0 }} mistakes</span>
                </div>
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h1 { color: #c7e2f7; font-size: 1.75rem; font-weight: 600; }
    .loading { display: flex; justify-content: center; padding: 4rem; }
    .empty-card {
      display: flex; flex-direction: column; align-items: center;
      padding: 4rem 2rem; text-align: center; gap: 1rem;
    }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: #5a6472; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
    .strategy-card {
      padding: 1.5rem; cursor: pointer; transition: transform 0.15s, border-color 0.2s;
      border: 1px solid transparent;
    }
    .strategy-card:hover { transform: translateY(-2px); border-color: #0ea5e9; }
    .strategy-card.inactive { opacity: 0.6; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .card-header h3 { color: #c7e2f7; font-size: 1.1rem; margin: 0; }
    .status-chip {
      font-size: 0.7rem; padding: 0.25rem 0.6rem; border-radius: 12px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-chip.active { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
    .status-chip.inactive-chip { background: rgba(156, 163, 175, 0.15); color: #9ca3af; }
    .description { color: #5a6472; font-size: 0.9rem; margin-bottom: 0.75rem; }
    .rules { margin-bottom: 0.75rem; }
    .rules-label { color: #5a6472; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
    .rules ul { margin: 0.25rem 0 0 1.25rem; padding: 0; }
    .rules li { color: #c7e2f7; font-size: 0.85rem; margin-bottom: 0.2rem; }
    .rules li.more { color: #5a6472; font-style: italic; }
    .card-footer { border-top: 1px solid #1e2d3d; padding-top: 0.75rem; margin-top: 0.5rem; }
    .stats { display: flex; align-items: center; gap: 0.4rem; }
    .stat-icon { font-size: 16px; width: 16px; height: 16px; color: #5a6472; }
    .stats span { color: #5a6472; font-size: 0.8rem; margin-right: 0.75rem; }
  `]
})
export class StrategyListComponent implements OnInit {
  strategies = signal<Strategy[]>([]);
  loading = signal(true);

  constructor(private strategyService: StrategyService) {}

  ngOnInit() {
    this.strategyService.getAll().subscribe({
      next: (data) => { this.strategies.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
