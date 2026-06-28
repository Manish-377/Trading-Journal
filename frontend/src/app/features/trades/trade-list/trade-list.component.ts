import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TradeService } from '../../../core/services/trade.service';
import { Trade } from '../../../core/models/trade.model';
import { ImportDialogComponent } from '../import-dialog/import-dialog.component';

@Component({
  selector: 'app-trade-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatChipsModule, MatIconModule,
    MatProgressSpinnerModule, MatCardModule, MatDialogModule,
  ],
  template: `
    <div class="trades-container">
      <div class="trades-header">
        <h1>My Trades</h1>
        <div class="header-actions">
          <button mat-stroked-button (click)="openImportDialog()" class="import-btn">
            <mat-icon>upload_file</mat-icon> Import
          </button>
          <a routerLink="/trades/new" mat-raised-button color="primary">
            <mat-icon>add</mat-icon> New Trade
          </a>
        </div>
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [value]="statusFilter" (selectionChange)="statusFilter = $event.value; resetAndLoad()">
              <mat-option value="">All Status</mat-option>
              <mat-option value="OPEN">Open</mat-option>
              <mat-option value="CLOSED">Closed</mat-option>
              <mat-option value="REVIEWED">Reviewed</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select [value]="typeFilter" (selectionChange)="typeFilter = $event.value; resetAndLoad()">
              <mat-option value="">All Types</mat-option>
              <mat-option value="EQUITY">Equity</mat-option>
              <mat-option value="OPTIONS">Options</mat-option>
              <mat-option value="FUTURES">Futures</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Symbol</mat-label>
            <input matInput [ngModel]="symbolFilter" (ngModelChange)="symbolFilter = $event" (keyup.enter)="resetAndLoad()" placeholder="e.g. AAPL">
          </mat-form-field>
        </div>
      </mat-card>

      @if (isLoading() && trades().length === 0) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading trades...</p>
        </div>
      } @else if (!isLoading() && trades().length === 0) {
        <mat-card class="empty-card">
          <mat-icon class="empty-icon">trending_up</mat-icon>
          <p>No trades yet. Start by adding your first trade!</p>
          <a routerLink="/trades/new" mat-raised-button color="primary">+ Add Trade</a>
        </mat-card>
      } @else {
        <div class="table-wrapper" [class.table-loading]="isLoading()">
          @if (isLoading()) {
            <div class="table-overlay">
              <mat-spinner diameter="32"></mat-spinner>
            </div>
          }
          <table mat-table [dataSource]="dataSource" matSort class="trades-table">
            <!-- Symbol Column -->
            <ng-container matColumnDef="symbol">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Symbol</th>
              <td mat-cell *matCellDef="let trade" class="symbol-cell">{{ trade.symbol }}</td>
            </ng-container>

            <!-- Type Column -->
            <ng-container matColumnDef="tradeType">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
              <td mat-cell *matCellDef="let trade">{{ trade.tradeType }}</td>
            </ng-container>

            <!-- Direction Column -->
            <ng-container matColumnDef="direction">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Direction</th>
              <td mat-cell *matCellDef="let trade">
                <span [class]="'direction-badge ' + trade.direction.toLowerCase()">{{ trade.direction }}</span>
              </td>
            </ng-container>

            <!-- Entry Column -->
            <ng-container matColumnDef="entryPrice">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Entry</th>
              <td mat-cell *matCellDef="let trade">{{ trade.entryPrice | number:'1.2-2' }}</td>
            </ng-container>

            <!-- Exit Column -->
            <ng-container matColumnDef="exitPrice">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Exit</th>
              <td mat-cell *matCellDef="let trade">{{ trade.exitPrice ? (trade.exitPrice | number:'1.2-2') : '—' }}</td>
            </ng-container>

            <!-- Qty Column -->
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Qty</th>
              <td mat-cell *matCellDef="let trade">{{ trade.quantity }}</td>
            </ng-container>

            <!-- P&L Column -->
            <ng-container matColumnDef="pnl">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>P&L</th>
              <td mat-cell *matCellDef="let trade" [class]="getPnlClass(trade.pnl)">
                {{ trade.pnl !== null ? (trade.pnl >= 0 ? '+' : '') + trade.pnl : '—' }}
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let trade">
                <span class="status-chip" [class]="trade.status.toLowerCase()">{{ trade.status }}</span>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="openedAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
              <td mat-cell *matCellDef="let trade">{{ trade.openedAt | date:'MMM d, y' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                class="clickable-row" (click)="goToTrade(row.id)"></tr>
          </table>

          <mat-paginator [length]="totalTrades()"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[10, 20, 50]"
                         (page)="onPageChange($event)"
                         showFirstLastButtons>
          </mat-paginator>
        </div>
      }
    </div>
  `,
  styles: [`
    .trades-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .trades-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .trades-header h1 {
      color: #c7e2f7;
      font-size: 1.75rem;
      font-weight: 600;
    }
    .header-actions {
      display: flex; gap: 0.75rem; align-items: center;
    }
    .import-btn {
      border-color: #1e2d3d; color: #8899a8;
    }
    .import-btn:hover {
      border-color: #0ea5e9; color: #0ea5e9;
    }
    .filter-card {
      margin-bottom: 1.5rem;
      padding: 1rem 1.5rem 0;
    }
    .filters {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .filter-field {
      min-width: 150px;
    }
    .table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1e2d3d;
      background: #131d2e;
      position: relative;
    }
    .table-wrapper.table-loading table {
      opacity: 0.4;
      pointer-events: none;
    }
    .table-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
    }
    .trades-table {
      width: 100%;
    }
    .clickable-row {
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .clickable-row:hover {
      background: #1e2d3d !important;
    }
    .symbol-cell {
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .direction-badge {
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    .direction-badge.long { color: #4ade80; }
    .direction-badge.short { color: #f87171; }
    .profit { color: #4ade80 !important; font-weight: 700; }
    .loss { color: #f87171 !important; font-weight: 700; }
    .status-chip {
      padding: 0.25rem 0.75rem;
      border-radius: 16px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-chip.open { background: rgba(250, 204, 21, 0.15); color: #facc15; }
    .status-chip.closed { background: rgba(199, 226, 247, 0.15); color: #c7e2f7; }
    .status-chip.reviewed { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
      color: #5a6472;
    }
    .empty-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      text-align: center;
      gap: 1rem;
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #5a6472;
    }
  `],
})
export class TradeListComponent implements OnInit {
  trades = signal<Trade[]>([]);
  isLoading = signal(true);
  totalPages = signal(1);
  totalTrades = signal(0);
  currentPage = 1;
  pageSize = 20;
  statusFilter = '';
  typeFilter = '';
  symbolFilter = '';

  displayedColumns = ['symbol', 'tradeType', 'direction', 'entryPrice', 'exitPrice', 'quantity', 'pnl', 'status', 'openedAt'];
  dataSource = new MatTableDataSource<Trade>([]);

  @ViewChild(MatSort) set sort(s: MatSort) {
    if (s) this.dataSource.sort = s;
  }
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private tradeService: TradeService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  openImportDialog() {
    const ref = this.dialog.open(ImportDialogComponent, {
      width: '640px',
      panelClass: 'dark-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.imported > 0) {
        this.loadTrades();
      }
    });
  }

  ngOnInit() {
    this.loadTrades();
  }

  loadTrades() {
    this.isLoading.set(true);
    const filters: Record<string, string> = {
      page: String(this.currentPage),
      limit: String(this.pageSize),
    };
    if (this.statusFilter) filters['status'] = this.statusFilter;
    if (this.typeFilter) filters['tradeType'] = this.typeFilter;
    if (this.symbolFilter) filters['symbol'] = this.symbolFilter;

    this.tradeService.getAll(filters).subscribe({
      next: (res) => {
        this.trades.set(res.data);
        this.dataSource.data = res.data;
        this.totalPages.set(res.meta.totalPages);
        this.totalTrades.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  getPnlClass(pnl: number | null): string {
    if (pnl === null) return '';
    return pnl >= 0 ? 'profit' : 'loss';
  }

  goToTrade(id: string) {
    this.router.navigate(['/trades', id]);
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadTrades();
  }

  resetAndLoad() {
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadTrades();
  }
}
