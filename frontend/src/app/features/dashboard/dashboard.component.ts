import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats, DailyPnl, SymbolBreakdown } from '../../core/models/dashboard.model';
import { ImportDialogComponent } from '../trades/import-dialog/import-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatDialogModule,
  ],
  template: `
    <div class="dashboard-content">
      <div class="page-header">
        <h2>Dashboard</h2>
        <div class="header-actions">
          <button mat-stroked-button (click)="openImportDialog()" class="import-btn">
            <mat-icon>upload_file</mat-icon> Import
          </button>
          <a routerLink="/trades/new" mat-raised-button color="primary">
            <mat-icon>add</mat-icon> New Trade
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-icon class="stat-icon trades-icon">receipt_long</mat-icon>
            <span class="stat-label">Total Trades</span>
            <span class="stat-value">{{ stats()?.totalTrades || 0 }}</span>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon class="stat-icon winrate-icon">emoji_events</mat-icon>
            <span class="stat-label">Win Rate</span>
            <span class="stat-value" [class.positive]="(stats()?.winRate || 0) >= 50" [class.negative]="(stats()?.winRate || 0) < 50 && (stats()?.closedTrades || 0) > 0">
              {{ stats()?.winRate || 0 }}%
            </span>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon class="stat-icon pnl-icon">account_balance_wallet</mat-icon>
            <span class="stat-label">Total P&L</span>
            <span class="stat-value" [class.positive]="(stats()?.totalPnl || 0) > 0" [class.negative]="(stats()?.totalPnl || 0) < 0">
              {{ (stats()?.totalPnl || 0) >= 0 ? '+' : '' }}{{ stats()?.totalPnl || 0 | number:'1.2-2' }}
            </span>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon class="stat-icon open-icon">pending</mat-icon>
            <span class="stat-label">Open Trades</span>
            <span class="stat-value">{{ stats()?.openTrades || 0 }}</span>
          </mat-card>
        </div>

        <div class="cards-row">
          <mat-card class="chart-card">
            <h3><mat-icon>bar_chart</mat-icon> Win / Loss</h3>
            <div class="wl-bar">
              <div class="wl-wins" [style.width.%]="stats()?.winRate || 0">
                {{ stats()?.wins || 0 }}W
              </div>
              <div class="wl-losses" [style.width.%]="100 - (stats()?.winRate || 0)">
                {{ stats()?.losses || 0 }}L
              </div>
            </div>
            <div class="wl-details">
              <span><mat-icon class="detail-icon positive">trending_up</mat-icon> Best: <strong class="positive">+{{ stats()?.largestWin || 0 | number:'1.2-2' }}</strong></span>
              <span><mat-icon class="detail-icon negative">trending_down</mat-icon> Worst: <strong class="negative">{{ stats()?.largestLoss || 0 | number:'1.2-2' }}</strong></span>
              <span><mat-icon class="detail-icon">analytics</mat-icon> Avg: <strong>{{ stats()?.averagePnl || 0 | number:'1.2-2' }}</strong></span>
            </div>
          </mat-card>

          <mat-card class="chart-card">
            <h3><mat-icon>pie_chart</mat-icon> Top Symbols</h3>
            @if (symbols().length === 0) {
              <p class="empty-text">No trades yet</p>
            } @else {
              <div class="symbol-list">
                @for (s of symbols().slice(0, 5); track s.symbol) {
                  <div class="symbol-row">
                    <span class="symbol-name">{{ s.symbol }}</span>
                    <div class="symbol-bar-bg">
                      <div class="symbol-bar" [style.width.%]="(s.count / maxSymbolCount()) * 100"></div>
                    </div>
                    <span class="symbol-count">{{ s.count }}</span>
                  </div>
                }
              </div>
            }
          </mat-card>
        </div>

        <mat-card class="chart-card full-width">
          <div class="chart-header">
            <h3><mat-icon>timeline</mat-icon> P&L Performance</h3>
            <div class="period-toggle">
              <button [class.active]="pnlPeriod() === 'daily'" (click)="setPeriod('daily')">Daily</button>
              <button [class.active]="pnlPeriod() === 'weekly'" (click)="setPeriod('weekly')">Weekly</button>
              <button [class.active]="pnlPeriod() === 'monthly'" (click)="setPeriod('monthly')">Monthly</button>
            </div>
          </div>
          @if (dailyPnl().length === 0) {
            <p class="empty-text">Close some trades to see your P&L chart</p>
          } @else {
            <div class="chart">
              <div class="y-axis">
                <span class="y-label">{{ barMaxLabel() }}</span>
                <span class="y-label zero">0</span>
                <span class="y-label">{{ barMinLabel() }}</span>
              </div>
              <div class="chart-area">
                <svg [attr.viewBox]="'0 0 ' + barChartWidth() + ' 200'" preserveAspectRatio="none" class="bar-chart">
                  <!-- Zero line -->
                  <line x1="0" [attr.y1]="barZeroY()" [attr.x2]="barChartWidth()" [attr.y2]="barZeroY()"
                    stroke="#3a4858" stroke-width="0.5" stroke-dasharray="4"/>
                  <!-- Bars -->
                  @for (bar of barsData(); track bar.label; let i = $index) {
                    <rect
                      [attr.x]="barX(i)"
                      [attr.y]="bar.pnl >= 0 ? barY(bar.pnl) : barZeroY()"
                      [attr.width]="barWidth()"
                      [attr.height]="Math.abs(barY(bar.pnl) - barZeroY())"
                      [attr.fill]="bar.pnl >= 0 ? '#4ade80' : '#f87171'"
                      rx="2"
                      class="pnl-bar"/>
                    <!-- Invisible hover target for full-height interaction -->
                    <rect
                      [attr.x]="barX(i) - 2"
                      y="0"
                      [attr.width]="barWidth() + 4"
                      height="200"
                      fill="transparent"
                      class="bar-hover-target"
                      (mouseenter)="showBarTooltip($event, bar)"
                      (mouseleave)="hideBarTooltip()"/>
                  }
                </svg>
                <!-- Custom bar tooltip -->
                @if (barTooltip) {
                  <div class="chart-tooltip" [style.left.px]="barTooltip.x" [style.top.px]="barTooltip.y">
                    <div class="tooltip-label">{{ barTooltip.label }}</div>
                    <div class="tooltip-value" [class.positive]="barTooltip.pnl >= 0" [class.negative]="barTooltip.pnl < 0">
                      {{ barTooltip.pnl >= 0 ? '+' : '' }}{{ barTooltip.pnl.toFixed(2) }}
                    </div>
                  </div>
                }
                <div class="bar-labels">
                  @for (bar of barLabels(); track $index) {
                    <span>{{ bar }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-box green"></span> Profit</span>
              <span class="legend-item"><span class="legend-box red"></span> Loss</span>
              <span class="legend-summary">
                Net: <strong [class.positive]="netPnl() >= 0" [class.negative]="netPnl() < 0">
                  {{ netPnl() >= 0 ? '+' : '' }}{{ netPnl() | number:'1.2-2' }}
                </strong>
              </span>
            </div>
          }
        </mat-card>

        <mat-card class="chart-card full-width">
          <h3><mat-icon>show_chart</mat-icon> Cumulative P&L</h3>
          @if (dailyPnl().length === 0) {
            <p class="empty-text">Close some trades to see your equity curve</p>
          } @else {
            <div class="chart">
              <div class="y-axis">
                <span class="y-label">{{ cumMaxLabel() }}</span>
                <span class="y-label zero">0</span>
                <span class="y-label">{{ cumMinLabel() }}</span>
              </div>
              <div class="chart-area">
                <svg viewBox="0 0 600 200" preserveAspectRatio="none" class="line-chart">
                  <defs>
                    <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <!-- Zero line -->
                  <line x1="0" [attr.y1]="cumZeroY()" x2="600" [attr.y2]="cumZeroY()"
                    stroke="#3a4858" stroke-width="0.5" stroke-dasharray="4"/>
                  <!-- Fill area -->
                  <polygon
                    [attr.points]="cumFillPoints()"
                    fill="url(#cumGradient)"
                  />
                  <!-- Line -->
                  <polyline
                    [attr.points]="cumLinePoints()"
                    fill="none"
                    stroke="#0ea5e9"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                  />
                  <!-- Hover dots -->
                  @for (pt of cumPoints(); track pt.date; let i = $index) {
                    <circle
                      [attr.cx]="pt.x" [attr.cy]="pt.y" r="12"
                      fill="transparent" class="cum-hover-target"
                      (mouseenter)="showCumTooltip($event, pt)"
                      (mouseleave)="hideCumTooltip()"/>
                    <circle
                      [attr.cx]="pt.x" [attr.cy]="pt.y" r="3"
                      fill="#0ea5e9" class="cum-dot" opacity="0"/>
                  }
                </svg>
                <!-- Custom cumulative tooltip -->
                @if (cumTooltip) {
                  <div class="chart-tooltip" [style.left.px]="cumTooltip.x" [style.top.px]="cumTooltip.y">
                    <div class="tooltip-label">{{ cumTooltip.date }}</div>
                    <div class="tooltip-value" [class.positive]="cumTooltip.value >= 0" [class.negative]="cumTooltip.value < 0">
                      {{ cumTooltip.value >= 0 ? '+' : '' }}{{ cumTooltip.value.toFixed(2) }}
                    </div>
                  </div>
                }
                <div class="bar-labels">
                  <span>{{ dailyPnl()[0]?.date }}</span>
                  <span>{{ dailyPnl()[dailyPnl().length - 1]?.date }}</span>
                </div>
              </div>
            </div>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-content { padding: 2rem; max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; }
    .header-actions { display: flex; gap: 0.75rem; align-items: center; }
    .import-btn { border-color: #1e2d3d; color: #8899a8; }
    .import-btn:hover { border-color: #0ea5e9; color: #0ea5e9; }
    h2 { color: #c7e2f7; font-size: 1.75rem; font-weight: 600; }
    .loading { display: flex; justify-content: center; padding: 4rem; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;
    }
    .stat-card {
      padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem;
      position: relative; overflow: hidden;
    }
    .stat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.8; }
    .trades-icon { color: #0ea5e9; }
    .winrate-icon { color: #facc15; }
    .pnl-icon { color: #4ade80; }
    .open-icon { color: #a78bfa; }
    .stat-label { color: #5a6472; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { color: #c7e2f7; font-size: 1.75rem; font-weight: 700; }
    .stat-value.positive { color: #4ade80; }
    .stat-value.negative { color: #f87171; }

    .cards-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    .chart-card { padding: 1.5rem; }
    .chart-card.full-width { grid-column: span 2; }
    .chart-card h3 {
      display: flex; align-items: center; gap: 0.5rem;
      color: #c7e2f7; font-size: 1rem; margin-bottom: 1.25rem; font-weight: 500;
    }
    .chart-card h3 mat-icon { font-size: 20px; width: 20px; height: 20px; color: #5a6472; }
    .empty-text { color: #5a6472; font-size: 0.85rem; }

    .wl-bar { display: flex; height: 32px; border-radius: 8px; overflow: hidden; margin-bottom: 1rem; }
    .wl-wins { background: #4ade80; color: #0b1220; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; min-width: 30px; }
    .wl-losses { background: #f87171; color: #0b1220; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; min-width: 30px; }
    .wl-details { display: flex; gap: 1.25rem; font-size: 0.8rem; color: #5a6472; }
    .wl-details span { display: flex; align-items: center; gap: 0.25rem; }
    .wl-details strong { color: #c7e2f7; }
    .detail-icon { font-size: 16px; width: 16px; height: 16px; }
    .positive { color: #4ade80 !important; }
    .negative { color: #f87171 !important; }

    .symbol-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .symbol-row { display: flex; align-items: center; gap: 0.75rem; }
    .symbol-name { color: #c7e2f7; font-size: 0.85rem; font-weight: 500; width: 55px; }
    .symbol-bar-bg { flex: 1; height: 8px; background: #1e2d3d; border-radius: 4px; overflow: hidden; }
    .symbol-bar { height: 100%; background: linear-gradient(90deg, #0ea5e9, #67e8f9); border-radius: 4px; transition: width 0.3s; }
    .symbol-count { color: #5a6472; font-size: 0.8rem; width: 28px; text-align: right; }

    .chart { margin-top: 0.5rem; display: flex; gap: 0; }
    .y-axis {
      display: flex; flex-direction: column; justify-content: space-between;
      align-items: flex-end; padding: 0 0.5rem 1.5rem 0; min-width: 60px;
    }
    .y-label { color: #5a6472; font-size: 0.7rem; }
    .y-label.zero { color: #8899a8; }
    .chart-area { flex: 1; overflow: hidden; }
    .bar-chart { width: 100%; height: 200px; }
    .pnl-bar { opacity: 0.85; transition: opacity 0.15s; cursor: pointer; }
    .pnl-bar:hover { opacity: 1; }
    .bar-labels {
      display: flex; justify-content: space-between;
      color: #5a6472; font-size: 0.65rem; margin-top: 0.35rem;
      padding: 0 4px;
    }
    .chart-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
    }
    .chart-header h3 { margin-bottom: 0; }
    .period-toggle {
      display: flex; gap: 2px; background: #131d2e; border-radius: 8px; padding: 2px;
      border: 1px solid #1e2d3d;
    }
    .period-toggle button {
      background: none; border: none; color: #5a6472; font-size: 0.75rem;
      padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer;
      transition: all 0.15s; font-family: inherit;
    }
    .period-toggle button.active {
      background: #0ea5e9; color: #fff; font-weight: 600;
    }
    .period-toggle button:hover:not(.active) { color: #c7e2f7; }
    .chart-legend {
      display: flex; align-items: center; gap: 1.25rem; margin-top: 0.75rem;
      padding-top: 0.75rem; border-top: 1px solid #1e2d3d;
      font-size: 0.75rem; color: #5a6472;
    }
    .legend-item { display: flex; align-items: center; gap: 0.35rem; }
    .legend-box { width: 12px; height: 12px; border-radius: 2px; }
    .legend-box.green { background: #4ade80; }
    .legend-box.red { background: #f87171; }
    .legend-line { width: 16px; height: 2px; background: #0ea5e9; border-radius: 1px; }
    .legend-summary { margin-left: auto; font-size: 0.8rem; }
    .legend-summary strong { font-size: 0.9rem; }
    .line-chart { width: 100%; height: 200px; }

    .chart-card.full-width + .chart-card.full-width { margin-top: 1rem; }

    .chart-area { position: relative; overflow: visible; padding-top: 2.5rem; }
    .chart-tooltip {
      position: absolute; pointer-events: none; z-index: 10;
      background: #1a2736; border: 1px solid #2a3f55; border-radius: 8px;
      padding: 0.5rem 0.75rem; transform: translate(-50%, -110%);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap;
    }
    .tooltip-label { color: #8899a8; font-size: 0.7rem; margin-bottom: 2px; }
    .tooltip-value { font-size: 0.9rem; font-weight: 700; }
    .tooltip-value.positive { color: #4ade80; }
    .tooltip-value.negative { color: #f87171; }

    .bar-hover-target { cursor: pointer; }
    .cum-hover-target { cursor: crosshair; }
    .cum-hover-target:hover + .cum-dot { opacity: 1 !important; }
    .cum-dot { transition: opacity 0.1s; pointer-events: none; }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .cards-row { grid-template-columns: 1fr; }
      .chart-card.full-width { grid-column: span 1; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  Math = Math;
  stats = signal<DashboardStats | null>(null);
  dailyPnl = signal<DailyPnl[]>([]);
  symbols = signal<SymbolBreakdown[]>([]);
  loading = signal(true);
  maxSymbolCount = signal(1);
  pnlPeriod = signal<'daily' | 'weekly' | 'monthly'>('daily');

  barTooltip: { x: number; y: number; label: string; pnl: number } | null = null;
  cumTooltip: { x: number; y: number; date: string; value: number } | null = null;

  constructor(
    private dashboardService: DashboardService,
    private dialog: MatDialog,
  ) {}

  openImportDialog() {
    const ref = this.dialog.open(ImportDialogComponent, {
      width: '640px',
      panelClass: 'dark-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.imported > 0) {
        this.ngOnInit();
      }
    });
  }

  ngOnInit() {
    this.dashboardService.getOverview().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.dashboardService.getDailyPnl().subscribe({
      next: (d) => this.dailyPnl.set(d),
    });
    this.dashboardService.getSymbolBreakdown().subscribe({
      next: (s) => {
        this.symbols.set(s);
        this.maxSymbolCount.set(s.length > 0 ? s[0].count : 1);
      },
    });
  }

  setPeriod(p: 'daily' | 'weekly' | 'monthly') {
    this.pnlPeriod.set(p);
  }

  barsData(): { label: string; pnl: number; cumulative: number }[] {
    const raw = this.dailyPnl();
    if (raw.length === 0) return [];
    const period = this.pnlPeriod();

    if (period === 'daily') {
      return raw.map(d => ({ label: d.date, pnl: d.pnl, cumulative: d.cumulative }));
    }

    const groups = new Map<string, { pnl: number }>();
    for (const d of raw) {
      const key = period === 'weekly' ? this.getWeekKey(d.date) : d.date.substring(0, 7);
      const existing = groups.get(key);
      if (existing) {
        existing.pnl += d.pnl;
      } else {
        groups.set(key, { pnl: d.pnl });
      }
    }

    let cum = 0;
    return Array.from(groups.entries()).map(([label, g]) => {
      cum += g.pnl;
      return { label, pnl: Math.round(g.pnl * 100) / 100, cumulative: Math.round(cum * 100) / 100 };
    });
  }

  private getWeekKey(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const dd = String(monday.getDate()).padStart(2, '0');
    return `${monday.getFullYear()}-${m}-${dd}`;
  }

  barLabels(): string[] {
    const bars = this.barsData();
    if (bars.length <= 10) return bars.map(b => this.formatLabel(b.label));
    const step = Math.ceil(bars.length / 8);
    return bars.map((b, i) => (i % step === 0 || i === bars.length - 1) ? this.formatLabel(b.label) : '');
  }

  private formatLabel(label: string): string {
    const period = this.pnlPeriod();
    if (period === 'monthly') {
      const [y, m] = label.split('-');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return months[parseInt(m) - 1] + ' ' + y.slice(2);
    }
    const parts = label.split('-');
    return parts[1] + '/' + parts[2];
  }

  barChartWidth(): number {
    return Math.max(this.barsData().length * 20, 600);
  }

  private barRange(): { max: number; min: number } {
    const bars = this.barsData();
    const pnls = bars.map(b => b.pnl);
    const cums = bars.map(b => b.cumulative);
    const all = [...pnls, ...cums, 0];
    return { max: Math.max(...all), min: Math.min(...all) };
  }

  barZeroY(): number {
    const { max, min } = this.barRange();
    const range = max - min || 1;
    return 10 + ((max - 0) / range) * 180;
  }

  barY(val: number): number {
    const { max, min } = this.barRange();
    const range = max - min || 1;
    return 10 + ((max - val) / range) * 180;
  }

  barX(i: number): number {
    const bars = this.barsData();
    const w = this.barChartWidth();
    const gap = w / bars.length;
    return i * gap + gap * 0.15;
  }

  barWidth(): number {
    const bars = this.barsData();
    const w = this.barChartWidth();
    const gap = w / bars.length;
    return gap * 0.7;
  }

  barMaxLabel(): string {
    const { max } = this.barRange();
    return max >= 1000 ? (max / 1000).toFixed(1) + 'k' : max.toFixed(0);
  }

  barMinLabel(): string {
    const { min } = this.barRange();
    return min <= -1000 ? (min / 1000).toFixed(1) + 'k' : min.toFixed(0);
  }

  netPnl(): number {
    const bars = this.barsData();
    return bars.length > 0 ? bars[bars.length - 1].cumulative : 0;
  }

  // --- Cumulative line chart (separate) ---
  private cumRange(): { max: number; min: number } {
    const data = this.dailyPnl();
    const vals = data.map(d => d.cumulative);
    return { max: Math.max(...vals, 0), min: Math.min(...vals, 0) };
  }

  cumZeroY(): number {
    const { max, min } = this.cumRange();
    const range = max - min || 1;
    return 10 + ((max - 0) / range) * 180;
  }

  cumLinePoints(): string {
    const data = this.dailyPnl();
    if (data.length === 0) return '';
    const { max, min } = this.cumRange();
    const range = max - min || 1;
    return data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * 600;
      const y = 10 + ((max - d.cumulative) / range) * 180;
      return `${x},${y}`;
    }).join(' ');
  }

  cumFillPoints(): string {
    const line = this.cumLinePoints();
    if (!line) return '';
    const data = this.dailyPnl();
    const bottom = this.cumZeroY();
    const lastX = (1) * 600;
    return line + ` ${lastX},${bottom} 0,${bottom}`;
  }

  cumMaxLabel(): string {
    const { max } = this.cumRange();
    return max >= 1000 ? (max / 1000).toFixed(1) + 'k' : max.toFixed(0);
  }

  cumMinLabel(): string {
    const { min } = this.cumRange();
    return min <= -1000 ? (min / 1000).toFixed(1) + 'k' : min.toFixed(0);
  }

  // --- Tooltip methods ---
  showBarTooltip(event: MouseEvent, bar: { label: string; pnl: number }) {
    const target = event.target as SVGRectElement;
    const container = target.closest('.chart-area') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.barTooltip = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      label: bar.label,
      pnl: bar.pnl,
    };
  }

  hideBarTooltip() {
    this.barTooltip = null;
  }

  cumPoints(): { x: number; y: number; date: string; cumulative: number }[] {
    const data = this.dailyPnl();
    if (data.length === 0) return [];
    const { max, min } = this.cumRange();
    const range = max - min || 1;
    return data.map((d, i) => ({
      x: (i / (data.length - 1 || 1)) * 600,
      y: 10 + ((max - d.cumulative) / range) * 180,
      date: d.date,
      cumulative: d.cumulative,
    }));
  }

  showCumTooltip(event: MouseEvent, pt: { date: string; cumulative: number }) {
    const target = event.target as SVGCircleElement;
    const container = target.closest('.chart-area') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.cumTooltip = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      date: pt.date,
      value: pt.cumulative,
    };
  }

  hideCumTooltip() {
    this.cumTooltip = null;
  }
}
