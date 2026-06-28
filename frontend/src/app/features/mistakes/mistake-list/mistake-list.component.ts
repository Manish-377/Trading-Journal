import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MistakeService } from '../../../core/services/mistake.service';
import { TradeService } from '../../../core/services/trade.service';
import { Mistake, MistakeCategory } from '../../../core/models/mistake.model';

@Component({
  selector: 'app-mistake-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Analysis</h1>
      </div>

      <!-- System Analysis Section -->
      <section class="analysis-section">
        <h2 class="section-title"><mat-icon class="section-icon">auto_awesome</mat-icon> System Analysis</h2>
        @if (insightsLoading()) {
          <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
        } @else if (insights().length === 0) {
          <mat-card class="no-insights-card">
            <mat-icon class="no-insights-icon">check_circle</mat-icon>
            <p>No patterns detected. Keep trading and the system will analyze your behavior.</p>
          </mat-card>
        } @else {
          <div class="insights-grid">
            @for (insight of insights(); track insight.category) {
              <mat-card class="insight-card" [attr.data-severity]="insight.severity">
                <div class="insight-header">
                  <mat-icon class="insight-icon">{{ getInsightIcon(insight.category) }}</mat-icon>
                  <span class="insight-category">{{ formatCategory(insight.category) }}</span>
                  <span class="severity-badge" [attr.data-severity]="insight.severity">{{ insight.severity }}</span>
                </div>
                <p class="insight-description">{{ insight.description }}</p>
                <div class="insight-footer">
                  <span class="trade-count">{{ insight.tradeIds.length }} trade(s) flagged</span>
                </div>
              </mat-card>
            }
          </div>
        }
      </section>

      <!-- My Mistakes Section -->
      <section class="mistakes-section">
        <div class="section-header">
          <h2 class="section-title"><mat-icon class="section-icon">school</mat-icon> My Mistakes</h2>
          <a routerLink="/mistakes/new" mat-raised-button color="primary">
            <mat-icon>add</mat-icon> Log Mistake
          </a>
        </div>

        <mat-card class="filter-card">
          <div class="filters">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Category</mat-label>
              <mat-select [value]="categoryFilter" (selectionChange)="categoryFilter = $event.value; loadMistakes()">
                <mat-option value="">All Categories</mat-option>
                @for (cat of categories; track cat) {
                  <mat-option [value]="cat">{{ formatCategory(cat) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Severity</mat-label>
              <mat-select [value]="severityFilter" (selectionChange)="severityFilter = $event.value; loadMistakes()">
                <mat-option value="">All Severity</mat-option>
                <mat-option value="LOW">Low</mat-option>
                <mat-option value="MEDIUM">Medium</mat-option>
                <mat-option value="HIGH">High</mat-option>
                <mat-option value="CRITICAL">Critical</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card>

        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (mistakes().length === 0) {
          <mat-card class="empty-card">
            <mat-icon class="empty-icon">school</mat-icon>
            <p>No mistakes logged yet. Track your mistakes to improve over time.</p>
            <a routerLink="/mistakes/new" mat-raised-button color="primary">Log your first mistake</a>
          </mat-card>
        } @else {
          <div class="list">
            @for (mistake of mistakes(); track mistake.id) {
              <mat-card class="mistake-card" [routerLink]="['/mistakes', mistake.id]">
                <div class="card-top">
                  <span class="severity" [attr.data-severity]="mistake.severity">{{ mistake.severity }}</span>
                  <span class="category">{{ formatCategory(mistake.category) }}</span>
                  <span class="date">{{ mistake.createdAt | date:'mediumDate' }}</span>
                </div>
                <p class="description">{{ mistake.description }}</p>
                @if (mistake.lesson) {
                  <p class="lesson"><mat-icon class="lesson-icon">lightbulb</mat-icon> {{ mistake.lesson }}</p>
                }
                <div class="card-bottom">
                  <div class="links">
                    @if (mistake.trade) {
                      <span class="link-badge"><mat-icon class="badge-icon">show_chart</mat-icon> {{ mistake.trade.symbol }}</span>
                    }
                    @if (mistake.strategy) {
                      <span class="link-badge"><mat-icon class="badge-icon">psychology</mat-icon> {{ mistake.strategy.name }}</span>
                    }
                  </div>
                </div>
              </mat-card>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .container { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h1 { color: #c7e2f7; font-size: 1.75rem; font-weight: 600; }
    .section-title {
      display: flex; align-items: center; gap: 0.5rem;
      color: #c7e2f7; font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;
    }
    .section-icon { font-size: 20px; width: 20px; height: 20px; color: #0ea5e9; }
    .analysis-section { margin-bottom: 2.5rem; }
    .mistakes-section { }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header .section-title { margin-bottom: 0; }
    .no-insights-card {
      display: flex; align-items: center; gap: 1rem; padding: 1.5rem;
    }
    .no-insights-icon { font-size: 32px; width: 32px; height: 32px; color: #4ade80; }
    .insights-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .insight-card {
      padding: 1.25rem; border-left: 3px solid transparent; transition: transform 0.15s;
    }
    .insight-card:hover { transform: translateY(-2px); }
    .insight-card[data-severity="CRITICAL"] { border-left-color: #f87171; }
    .insight-card[data-severity="HIGH"] { border-left-color: #fb923c; }
    .insight-card[data-severity="MEDIUM"] { border-left-color: #facc15; }
    .insight-card[data-severity="LOW"] { border-left-color: #4ade80; }
    .insight-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .insight-icon { font-size: 20px; width: 20px; height: 20px; color: #0ea5e9; }
    .insight-category { font-weight: 600; color: #c7e2f7; font-size: 0.9rem; }
    .severity-badge {
      margin-left: auto; font-size: 0.65rem; padding: 0.2rem 0.5rem;
      border-radius: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .severity-badge[data-severity="CRITICAL"] { background: rgba(239,68,68,0.15); color: #f87171; }
    .severity-badge[data-severity="HIGH"] { background: rgba(249,115,22,0.15); color: #fb923c; }
    .severity-badge[data-severity="MEDIUM"] { background: rgba(234,179,8,0.15); color: #facc15; }
    .severity-badge[data-severity="LOW"] { background: rgba(34,197,94,0.15); color: #4ade80; }
    .insight-description { color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin-bottom: 0.75rem; }
    .insight-footer { border-top: 1px solid #1e2d3d; padding-top: 0.5rem; }
    .trade-count { color: #5a6472; font-size: 0.75rem; }
    .filter-card { margin-bottom: 1.5rem; padding: 1rem 1.5rem 0; }
    .filters { display: flex; gap: 1rem; }
    .filter-field { min-width: 180px; }
    .loading { display: flex; justify-content: center; padding: 4rem; }
    .empty-card {
      display: flex; flex-direction: column; align-items: center;
      padding: 4rem 2rem; text-align: center; gap: 1rem;
    }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: #5a6472; }
    .list { display: flex; flex-direction: column; gap: 0.75rem; }
    .mistake-card { padding: 1.5rem; cursor: pointer; transition: transform 0.15s; border: 1px solid transparent; }
    .mistake-card:hover { transform: translateY(-2px); border-color: #0ea5e9; }
    .card-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .severity {
      font-size: 0.7rem; padding: 0.25rem 0.6rem; border-radius: 12px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .severity[data-severity="LOW"] { background: rgba(34,197,94,0.15); color: #4ade80; }
    .severity[data-severity="MEDIUM"] { background: rgba(234,179,8,0.15); color: #facc15; }
    .severity[data-severity="HIGH"] { background: rgba(249,115,22,0.15); color: #fb923c; }
    .severity[data-severity="CRITICAL"] { background: rgba(239,68,68,0.15); color: #f87171; }
    .category { color: #c7e2f7; font-size: 0.85rem; font-weight: 500; }
    .date { color: #5a6472; font-size: 0.8rem; margin-left: auto; }
    .description { color: #c7e2f7; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .lesson { display: flex; align-items: center; gap: 0.4rem; color: #5a6472; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .lesson-icon { font-size: 16px; width: 16px; height: 16px; color: #facc15; }
    .card-bottom { border-top: 1px solid #1e2d3d; padding-top: 0.75rem; }
    .links { display: flex; gap: 0.5rem; }
    .link-badge {
      display: flex; align-items: center; gap: 0.25rem;
      background: rgba(14, 165, 233, 0.1); color: #0ea5e9; padding: 0.25rem 0.6rem;
      border-radius: 12px; font-size: 0.8rem;
    }
    .badge-icon { font-size: 14px; width: 14px; height: 14px; }
  `]
})
export class MistakeListComponent implements OnInit {
  mistakes = signal<Mistake[]>([]);
  insights = signal<any[]>([]);
  loading = signal(true);
  insightsLoading = signal(true);
  categoryFilter = '';
  severityFilter = '';

  categories: MistakeCategory[] = [
    'FOMO', 'OVERTRADING', 'NO_STOP_LOSS', 'MOVED_STOP_LOSS', 'EARLY_EXIT',
    'LATE_ENTRY', 'REVENGE_TRADE', 'POSITION_SIZE', 'IGNORED_RULES', 'EMOTIONAL', 'OTHER'
  ];

  constructor(
    private mistakeService: MistakeService,
    private tradeService: TradeService,
  ) {}

  ngOnInit() {
    this.loadMistakes();
    this.loadInsights();
  }

  loadInsights() {
    this.insightsLoading.set(true);
    this.tradeService.getInsights().subscribe({
      next: (data) => { this.insights.set(data); this.insightsLoading.set(false); },
      error: () => this.insightsLoading.set(false),
    });
  }

  loadMistakes() {
    this.loading.set(true);
    const params: any = {};
    if (this.categoryFilter) params.category = this.categoryFilter;
    if (this.severityFilter) params.severity = this.severityFilter;
    this.mistakeService.getAll(params).subscribe({
      next: (data) => { this.mistakes.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getInsightIcon(category: string): string {
    const icons: Record<string, string> = {
      NO_STOP_LOSS: 'dangerous',
      REVENGE_TRADE: 'local_fire_department',
      OVERTRADING: 'speed',
      EARLY_EXIT: 'exit_to_app',
      POSITION_SIZE: 'balance',
      FOMO: 'trending_up',
    };
    return icons[category] || 'insights';
  }
}
