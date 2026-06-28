import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TradeService } from '../../../core/services/trade.service';
import { Trade } from '../../../core/models/trade.model';

@Component({
  selector: 'app-trade-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="detail-container">
      @if (isLoading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (trade()) {
        <div class="detail-header">
          <div class="title-row">
            <a routerLink="/trades" mat-icon-button class="back-btn">
              <mat-icon>arrow_back</mat-icon>
            </a>
            <h1>{{ trade()!.symbol }}</h1>
            <span class="status-chip" [attr.data-status]="trade()!.status.toLowerCase()">{{ trade()!.status }}</span>
            <span class="direction-chip" [attr.data-dir]="trade()!.direction.toLowerCase()">
              <mat-icon class="dir-icon">{{ trade()!.direction === 'LONG' ? 'trending_up' : 'trending_down' }}</mat-icon>
              {{ trade()!.direction }}
            </span>
          </div>
          <div class="actions">
            @if (trade()!.status === 'OPEN') {
              <button mat-raised-button color="primary" (click)="closeTrade()">
                <mat-icon>lock</mat-icon> Close Trade
              </button>
            }
            @if (trade()!.status === 'CLOSED') {
              <button mat-raised-button class="review-btn" (click)="reviewTrade()">
                <mat-icon>rate_review</mat-icon> Mark Reviewed
              </button>
            }
            <button mat-stroked-button color="warn" (click)="deleteTrade()">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </div>
        </div>

        <!-- P&L Hero Card -->
        <mat-card class="pnl-hero">
          <div class="pnl-content">
            <span class="pnl-label">Profit / Loss</span>
            <span class="pnl-value" [class]="getPnlClass()">
              {{ trade()!.pnl !== null ? (trade()!.pnl! >= 0 ? '+$' : '-$') + absVal(trade()!.pnl!) : 'Open Position' }}
            </span>
          </div>
          <mat-icon class="pnl-bg-icon" [class]="getPnlClass()">
            {{ trade()!.pnl !== null ? (trade()!.pnl! >= 0 ? 'trending_up' : 'trending_down') : 'hourglass_empty' }}
          </mat-icon>
        </mat-card>

        <div class="detail-grid">
          <mat-card class="info-card">
            <h3><mat-icon>info</mat-icon> Trade Info</h3>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Type</span><span>{{ trade()!.tradeType }}</span></div>
            <div class="info-row"><span>Direction</span><span [class]="trade()!.direction.toLowerCase()">{{ trade()!.direction }}</span></div>
            <div class="info-row"><span>Quantity</span><span>{{ trade()!.quantity }}</span></div>
            <div class="info-row"><span>Fees</span><span>{{ trade()!.fees }}</span></div>
            @if (trade()!.tags.length) {
              <div class="tags-row">
                @for (tag of trade()!.tags; track tag) {
                  <mat-chip>{{ tag }}</mat-chip>
                }
              </div>
            }
          </mat-card>

          <mat-card class="info-card">
            <h3><mat-icon>attach_money</mat-icon> Prices</h3>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Entry</span><span class="mono">\${{ trade()!.entryPrice }}</span></div>
            <div class="info-row"><span>Exit</span><span class="mono">{{ trade()!.exitPrice ? '$' + trade()!.exitPrice : 'Open' }}</span></div>
            <div class="info-row"><span>Stop Loss</span><span class="mono">{{ trade()!.stopLoss ? '$' + trade()!.stopLoss : '—' }}</span></div>
            <div class="info-row"><span>Take Profit</span><span class="mono">{{ trade()!.takeProfit ? '$' + trade()!.takeProfit : '—' }}</span></div>
            <div class="info-row"><span>R:R Ratio</span><span>{{ trade()!.riskRewardRatio ?? '—' }}</span></div>
          </mat-card>

          <mat-card class="info-card">
            <h3><mat-icon>schedule</mat-icon> Timeline</h3>
            <mat-divider></mat-divider>
            <div class="info-row"><span>Opened</span><span>{{ trade()!.openedAt | date:'medium' }}</span></div>
            @if (trade()!.closedAt) {
              <div class="info-row"><span>Closed</span><span>{{ trade()!.closedAt | date:'medium' }}</span></div>
            }
            @if (trade()!.reviewedAt) {
              <div class="info-row"><span>Reviewed</span><span>{{ trade()!.reviewedAt | date:'medium' }}</span></div>
            }
          </mat-card>

          <mat-card class="info-card screenshots-card">
            <h3><mat-icon>image</mat-icon> Screenshots</h3>
            <mat-divider></mat-divider>
            @if (trade()!.images.length > 0) {
              <div class="screenshot-grid">
                @for (img of trade()!.images; track img.id) {
                  <div class="screenshot-item">
                    <img [src]="'/api/trades/uploads/' + getFilename(img.filePath)" [alt]="img.originalName">
                    <button mat-icon-button class="delete-img-btn" (click)="deleteImage(img.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                    <span class="img-name">{{ img.originalName }}</span>
                  </div>
                }
              </div>
            } @else {
              <p class="muted">No screenshots uploaded.</p>
            }
            <label class="upload-btn">
              <mat-icon>cloud_upload</mat-icon> Upload Screenshot
              <input type="file" accept="image/*" (change)="uploadImage($event)" hidden>
            </label>
          </mat-card>
        </div>

        @if (trade()!.notes) {
          <mat-card class="notes-card">
            <h3><mat-icon>notes</mat-icon> Notes</h3>
            <mat-divider></mat-divider>
            <p>{{ trade()!.notes }}</p>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .detail-container { padding: 1.5rem; max-width: 1000px; margin: 0 auto; }
    .loading { display: flex; justify-content: center; padding: 4rem; }
    .detail-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .title-row { display: flex; align-items: center; gap: 0.75rem; }
    .back-btn { color: #5a6472; }
    .title-row h1 { color: #c7e2f7; font-size: 1.75rem; font-weight: 700; margin: 0; }
    .status-chip {
      font-size: 0.7rem; padding: 0.25rem 0.7rem; border-radius: 12px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-chip[data-status="open"] { background: rgba(250, 204, 21, 0.15); color: #facc15; }
    .status-chip[data-status="closed"] { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
    .status-chip[data-status="reviewed"] { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
    .direction-chip {
      display: flex; align-items: center; gap: 0.25rem;
      font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 12px;
    }
    .direction-chip[data-dir="long"] { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
    .direction-chip[data-dir="short"] { background: rgba(248, 113, 113, 0.15); color: #f87171; }
    .dir-icon { font-size: 14px; width: 14px; height: 14px; }
    .actions { display: flex; gap: 0.5rem; align-items: center; }
    .review-btn { background: #16a34a !important; color: white !important; }

    .pnl-hero {
      padding: 2rem; margin-bottom: 1.5rem; position: relative; overflow: hidden;
    }
    .pnl-content { position: relative; z-index: 1; }
    .pnl-label { color: #5a6472; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem; }
    .pnl-value { font-size: 2.5rem; font-weight: 800; }
    .pnl-value.profit { color: #4ade80; }
    .pnl-value.loss { color: #f87171; }
    .pnl-value.neutral { color: #5a6472; }
    .pnl-bg-icon {
      position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%);
      font-size: 80px; width: 80px; height: 80px; opacity: 0.08;
    }
    .pnl-bg-icon.profit { color: #4ade80; }
    .pnl-bg-icon.loss { color: #f87171; }
    .pnl-bg-icon.neutral { color: #5a6472; }

    .detail-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-bottom: 1.5rem;
    }
    .info-card { padding: 1.5rem; }
    .info-card h3 {
      display: flex; align-items: center; gap: 0.5rem;
      color: #c7e2f7; font-size: 1rem; margin-bottom: 0.75rem; font-weight: 500;
    }
    .info-card h3 mat-icon { font-size: 20px; width: 20px; height: 20px; color: #5a6472; }
    mat-divider { margin-bottom: 1rem !important; border-top-color: #1e2d3d !important; }
    .info-row {
      display: flex; justify-content: space-between; padding: 0.5rem 0;
      font-size: 0.9rem; border-bottom: 1px solid rgba(30, 45, 61, 0.5);
    }
    .info-row:last-child { border-bottom: none; }
    .info-row span:first-child { color: #5a6472; }
    .info-row span:last-child { color: #c7e2f7; font-weight: 500; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .long { color: #4ade80 !important; }
    .short { color: #f87171 !important; }
    .tags-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
    .muted { color: #5a6472; font-size: 0.9rem; }
    .upload-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: rgba(14, 165, 233, 0.1); color: #0ea5e9;
      padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;
      font-size: 0.85rem; margin-top: 0.75rem; transition: background 0.15s;
    }
    .upload-btn:hover { background: rgba(14, 165, 233, 0.2); }
    .upload-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .screenshot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .screenshot-item {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #1e2d3d;
      background: #0b1220;
      img {
        width: 100%;
        height: 110px;
        object-fit: cover;
        display: block;
        cursor: pointer;
      }
      .delete-img-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.7);
        color: #f87171;
        width: 28px;
        height: 28px;
        line-height: 28px;
      }
      .img-name {
        display: block;
        padding: 4px 8px;
        font-size: 0.7rem;
        color: #8899a8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    .screenshots-card {
      grid-column: span 2;
    }

    .notes-card { padding: 1.5rem; }
    .notes-card h3 {
      display: flex; align-items: center; gap: 0.5rem;
      color: #c7e2f7; font-size: 1rem; margin-bottom: 0.75rem; font-weight: 500;
    }
    .notes-card h3 mat-icon { font-size: 20px; width: 20px; height: 20px; color: #5a6472; }
    .notes-card p { color: #c7e2f7; line-height: 1.7; font-size: 0.9rem; }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .detail-header { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class TradeDetailComponent implements OnInit {
  trade = signal<Trade | null>(null);
  isLoading = signal(true);

  constructor(
    private tradeService: TradeService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.tradeService.getOne(id).subscribe({
      next: (t) => { this.trade.set(t); this.isLoading.set(false); },
      error: () => this.router.navigate(['/trades']),
    });
  }

  getPnlClass(): string {
    const pnl = this.trade()?.pnl;
    if (pnl === null || pnl === undefined) return 'neutral';
    return pnl >= 0 ? 'profit' : 'loss';
  }

  absVal(n: number): string {
    return Math.abs(n).toFixed(2);
  }

  closeTrade() {
    const exit = prompt('Enter exit price:');
    if (!exit) return;
    this.tradeService.close(this.trade()!.id, Number(exit)).subscribe({
      next: (t) => this.trade.set(t),
    });
  }

  reviewTrade() {
    const notes = prompt('Review notes (optional):');
    this.tradeService.review(this.trade()!.id, notes || undefined).subscribe({
      next: (t) => this.trade.set(t),
    });
  }

  deleteTrade() {
    if (!confirm('Delete this trade?')) return;
    this.tradeService.delete(this.trade()!.id).subscribe({
      next: () => this.router.navigate(['/trades']),
    });
  }

  uploadImage(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.tradeService.uploadImage(this.trade()!.id, file).subscribe({
      next: () => {
        this.tradeService.getOne(this.trade()!.id).subscribe(t => this.trade.set(t));
      },
    });
  }

  deleteImage(imageId: string) {
    if (!confirm('Delete this screenshot?')) return;
    this.tradeService.deleteImage(this.trade()!.id, imageId).subscribe({
      next: () => {
        this.tradeService.getOne(this.trade()!.id).subscribe(t => this.trade.set(t));
      },
    });
  }

  getFilename(filePath: string): string {
    return filePath.replace(/\\/g, '/').split('/').pop() || filePath;
  }
}
