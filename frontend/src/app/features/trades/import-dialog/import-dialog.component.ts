import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TradeService } from '../../../core/services/trade.service';
import * as XLSX from 'xlsx';

interface ParsedTrade {
  symbol: string;
  tradeType: string;
  direction: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  fees?: number;
  openedAt: string;
  closedAt?: string;
  notes?: string;
  tags?: string[];
}

interface RowError {
  row: number;
  reason: string;
}

const COLUMN_MAP: Record<string, string> = {
  'symbol': 'symbol', 'ticker': 'symbol', 'stock': 'symbol', 'instrument': 'symbol', 'scrip': 'symbol',
  'type': 'tradeType', 'tradetype': 'tradeType', 'trade type': 'tradeType', 'asset': 'tradeType', 'asset type': 'tradeType',
  'direction': 'direction', 'side': 'direction', 'action': 'direction', 'buy/sell': 'direction',
  'entry': 'entryPrice', 'entryprice': 'entryPrice', 'entry price': 'entryPrice', 'buy price': 'entryPrice', 'open price': 'entryPrice', 'price': 'entryPrice',
  'exit': 'exitPrice', 'exitprice': 'exitPrice', 'exit price': 'exitPrice', 'sell price': 'exitPrice', 'close price': 'exitPrice',
  'quantity': 'quantity', 'qty': 'quantity', 'shares': 'quantity', 'lots': 'quantity', 'size': 'quantity', 'volume': 'quantity',
  'stoploss': 'stopLoss', 'stop loss': 'stopLoss', 'sl': 'stopLoss', 'stop': 'stopLoss',
  'takeprofit': 'takeProfit', 'take profit': 'takeProfit', 'tp': 'takeProfit', 'target': 'takeProfit',
  'fees': 'fees', 'commission': 'fees', 'brokerage': 'fees', 'charges': 'fees',
  'date': 'openedAt', 'openedat': 'openedAt', 'opened at': 'openedAt', 'entry date': 'openedAt', 'open date': 'openedAt', 'trade date': 'openedAt',
  'closedate': 'closedAt', 'close date': 'closedAt', 'closed at': 'closedAt', 'exit date': 'closedAt',
  'notes': 'notes', 'comments': 'notes', 'remark': 'notes', 'remarks': 'notes',
  'tags': 'tags', 'labels': 'tags', 'category': 'tags',
};

const DIRECTION_MAP: Record<string, string> = {
  'long': 'LONG', 'buy': 'LONG', 'b': 'LONG', 'bullish': 'LONG',
  'short': 'SHORT', 'sell': 'SHORT', 's': 'SHORT', 'bearish': 'SHORT',
};

const TRADE_TYPE_MAP: Record<string, string> = {
  'equity': 'EQUITY', 'stock': 'EQUITY', 'stocks': 'EQUITY', 'cash': 'EQUITY', 'share': 'EQUITY',
  'options': 'OPTIONS', 'option': 'OPTIONS', 'opt': 'OPTIONS',
  'futures': 'FUTURES', 'future': 'FUTURES', 'fut': 'FUTURES', 'f&o': 'FUTURES',
  'forex': 'FOREX', 'fx': 'FOREX', 'currency': 'FOREX',
  'crypto': 'CRYPTO', 'cryptocurrency': 'CRYPTO', 'coin': 'CRYPTO',
  'commodity': 'COMMODITY', 'commodities': 'COMMODITY', 'mcx': 'COMMODITY',
  'index': 'INDEX', 'indices': 'INDEX', 'nifty': 'INDEX',
};

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatTableModule, MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">upload_file</mat-icon>
      Import Trades
    </h2>

    <mat-dialog-content>
      <!-- Step 1: Upload -->
      @if (step() === 'upload') {
        <div class="upload-zone"
          (dragover)="onDragOver($event)"
          (dragleave)="dragOver.set(false)"
          (drop)="onDrop($event)"
          [class.drag-over]="dragOver()">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <p class="upload-text">Drag & drop your file here</p>
          <p class="upload-sub">or</p>
          <button mat-stroked-button (click)="fileInput.click()">
            <mat-icon>folder_open</mat-icon> Browse Files
          </button>
          <p class="upload-hint">Supports .csv and .xlsx files (max 500 trades)</p>
          <input #fileInput type="file" hidden accept=".csv,.xlsx,.xls"
            (change)="onFileSelected($event)">
        </div>

        <div class="sample-section">
          <p class="sample-title">Expected columns:</p>
          <div class="sample-cols">
            <span class="col required">Symbol *</span>
            <span class="col required">Direction *</span>
            <span class="col required">Entry Price *</span>
            <span class="col required">Quantity *</span>
            <span class="col required">Date *</span>
            <span class="col">Exit Price</span>
            <span class="col">Type</span>
            <span class="col">Stop Loss</span>
            <span class="col">Take Profit</span>
            <span class="col">Fees</span>
            <span class="col">Close Date</span>
            <span class="col">Notes</span>
            <span class="col">Tags</span>
          </div>
          <button mat-button class="download-btn" (click)="downloadTemplate()">
            <mat-icon>download</mat-icon> Download Template
          </button>
        </div>
      }

      <!-- Step 2: Preview -->
      @if (step() === 'preview') {
        <div class="preview-summary">
          <div class="stat valid">
            <mat-icon>check_circle</mat-icon>
            <span>{{ validTrades().length }} valid</span>
          </div>
          <div class="stat errors" [class.hidden]="errorRows().length === 0">
            <mat-icon>error</mat-icon>
            <span>{{ errorRows().length }} skipped</span>
          </div>
          <div class="stat total">
            <mat-icon>table_chart</mat-icon>
            <span>{{ validTrades().length + errorRows().length }} total rows</span>
          </div>
        </div>

        @if (errorRows().length > 0) {
          <div class="error-list">
            <p class="error-title">Skipped rows:</p>
            @for (err of errorRows(); track err.row) {
              <div class="error-row">
                <span class="row-num">Row {{ err.row }}</span>
                <span class="row-reason">{{ err.reason }}</span>
              </div>
            }
          </div>
        }

        @if (validTrades().length > 0) {
          <div class="preview-table-wrap">
            <table mat-table [dataSource]="previewData()" class="preview-table">
              <ng-container matColumnDef="symbol">
                <th mat-header-cell *matHeaderCellDef>Symbol</th>
                <td mat-cell *matCellDef="let t">{{ t.symbol }}</td>
              </ng-container>
              <ng-container matColumnDef="direction">
                <th mat-header-cell *matHeaderCellDef>Side</th>
                <td mat-cell *matCellDef="let t">
                  <span [class]="t.direction === 'LONG' ? 'long' : 'short'">{{ t.direction }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="entryPrice">
                <th mat-header-cell *matHeaderCellDef>Entry</th>
                <td mat-cell *matCellDef="let t">{{ t.entryPrice }}</td>
              </ng-container>
              <ng-container matColumnDef="exitPrice">
                <th mat-header-cell *matHeaderCellDef>Exit</th>
                <td mat-cell *matCellDef="let t">{{ t.exitPrice || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Qty</th>
                <td mat-cell *matCellDef="let t">{{ t.quantity }}</td>
              </ng-container>
              <ng-container matColumnDef="openedAt">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">{{ t.openedAt | date:'shortDate' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="previewCols"></tr>
              <tr mat-row *matRowDef="let row; columns: previewCols;"></tr>
            </table>
          </div>
          @if (validTrades().length > 5) {
            <p class="more-hint">Showing first 5 of {{ validTrades().length }} trades</p>
          }
        }
      }

      <!-- Step 3: Importing -->
      @if (step() === 'importing') {
        <div class="importing">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Importing {{ validTrades().length }} trades...</p>
        </div>
      }

      <!-- Step 4: Result -->
      @if (step() === 'result') {
        <div class="result">
          <mat-icon class="result-icon" [class.success]="importResult()!.imported > 0">
            {{ importResult()!.imported > 0 ? 'check_circle' : 'error' }}
          </mat-icon>
          <h3>Import Complete</h3>
          <div class="result-stats">
            <p class="imported">{{ importResult()!.imported }} trades imported</p>
            @if (importResult()!.failed > 0) {
              <p class="failed">{{ importResult()!.failed }} failed</p>
            }
          </div>
          @if (importResult()!.errors.length > 0) {
            <div class="error-list">
              @for (err of importResult()!.errors; track err) {
                <div class="error-row">{{ err }}</div>
              }
            </div>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (step() === 'upload') {
        <button mat-button mat-dialog-close>Cancel</button>
      }
      @if (step() === 'preview') {
        <button mat-button (click)="step.set('upload')">Back</button>
        <button mat-raised-button color="primary"
          [disabled]="validTrades().length === 0"
          (click)="doImport()">
          <mat-icon>upload</mat-icon>
          Import {{ validTrades().length }} Trades
        </button>
      }
      @if (step() === 'result') {
        <button mat-raised-button color="primary" (click)="dialogRef.close(importResult())">
          Done
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 0.5rem; color: #c7e2f7; }
    .title-icon { color: #0ea5e9; }

    .upload-zone {
      border: 2px dashed #1e2d3d; border-radius: 12px; padding: 2.5rem 2rem;
      text-align: center; transition: all 0.2s; cursor: pointer;
      margin-bottom: 1.5rem;
    }
    .upload-zone.drag-over { border-color: #0ea5e9; background: rgba(14,165,233,0.05); }
    .upload-icon { font-size: 48px; width: 48px; height: 48px; color: #0ea5e9; }
    .upload-text { color: #c7e2f7; font-size: 1rem; margin: 0.5rem 0 0.25rem; }
    .upload-sub { color: #5a6472; font-size: 0.85rem; margin: 0.25rem 0 0.75rem; }
    .upload-hint { color: #3a4858; font-size: 0.75rem; margin-top: 1rem; }

    .sample-section { margin-top: 0.5rem; }
    .sample-title { color: #8899a8; font-size: 0.8rem; margin-bottom: 0.5rem; }
    .sample-cols { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .col {
      background: #131d2e; border: 1px solid #1e2d3d; border-radius: 6px;
      padding: 0.2rem 0.5rem; font-size: 0.75rem; color: #8899a8;
    }
    .col.required { border-color: #0ea5e9; color: #0ea5e9; }
    .download-btn { margin-top: 0.75rem; font-size: 0.8rem; color: #0ea5e9; }

    .preview-summary {
      display: flex; gap: 1rem; margin-bottom: 1rem;
    }
    .stat {
      display: flex; align-items: center; gap: 0.4rem;
      background: #131d2e; border-radius: 8px; padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }
    .stat.valid { color: #34d399; }
    .stat.valid mat-icon { color: #34d399; }
    .stat.errors { color: #f87171; }
    .stat.errors mat-icon { color: #f87171; }
    .stat.total { color: #8899a8; }
    .stat.hidden { display: none; }

    .error-list {
      background: rgba(248,113,113,0.05); border: 1px solid rgba(248,113,113,0.2);
      border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;
      max-height: 120px; overflow-y: auto;
    }
    .error-title { color: #f87171; font-size: 0.8rem; margin: 0 0 0.5rem; font-weight: 600; }
    .error-row {
      font-size: 0.75rem; color: #8899a8; padding: 0.2rem 0;
      display: flex; gap: 0.5rem;
    }
    .row-num { color: #f87171; font-weight: 600; min-width: 50px; }

    .preview-table-wrap {
      max-height: 250px; overflow-y: auto; border-radius: 8px;
      border: 1px solid #1e2d3d;
    }
    .preview-table { width: 100%; }
    .long { color: #34d399; font-weight: 600; }
    .short { color: #f87171; font-weight: 600; }
    .more-hint { color: #5a6472; font-size: 0.75rem; text-align: center; margin-top: 0.5rem; }

    .importing {
      display: flex; flex-direction: column; align-items: center;
      gap: 1rem; padding: 3rem 0; color: #c7e2f7;
    }

    .result { text-align: center; padding: 1.5rem 0; }
    .result-icon { font-size: 56px; width: 56px; height: 56px; color: #f87171; }
    .result-icon.success { color: #34d399; }
    .result h3 { color: #c7e2f7; margin: 0.75rem 0 0.5rem; }
    .imported { color: #34d399; font-size: 1.1rem; font-weight: 600; }
    .failed { color: #f87171; font-size: 0.9rem; }
    .result .error-list { margin-top: 1rem; text-align: left; }

    mat-dialog-content { min-width: 500px; max-width: 600px; }
  `],
})
export class ImportDialogComponent {
  step = signal<'upload' | 'preview' | 'importing' | 'result'>('upload');
  dragOver = signal(false);
  validTrades = signal<ParsedTrade[]>([]);
  errorRows = signal<RowError[]>([]);
  previewData = signal<ParsedTrade[]>([]);
  importResult = signal<{ imported: number; failed: number; errors: string[] } | null>(null);
  previewCols = ['symbol', 'direction', 'entryPrice', 'exitPrice', 'quantity', 'openedAt'];

  constructor(
    public dialogRef: MatDialogRef<ImportDialogComponent>,
    private tradeService: TradeService,
  ) {}

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.parseFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.parseFile(file);
  }

  parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          this.errorRows.set([{ row: 0, reason: 'File contains no data rows' }]);
          this.validTrades.set([]);
          this.step.set('preview');
          return;
        }

        this.processRows(rows);
        this.step.set('preview');
      } catch {
        this.errorRows.set([{ row: 0, reason: 'Could not parse file. Ensure it is a valid CSV or Excel file.' }]);
        this.validTrades.set([]);
        this.step.set('preview');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  processRows(rows: any[]) {
    // Build column mapping from headers
    const firstRow = rows[0];
    const headerMap: Record<string, string> = {};
    for (const key of Object.keys(firstRow)) {
      const normalized = key.toLowerCase().trim();
      if (COLUMN_MAP[normalized]) {
        headerMap[key] = COLUMN_MAP[normalized];
      }
    }

    // Check required columns exist
    const mappedFields = new Set(Object.values(headerMap));
    const missing: string[] = [];
    if (!mappedFields.has('symbol')) missing.push('Symbol');
    if (!mappedFields.has('direction')) missing.push('Direction/Side');
    if (!mappedFields.has('entryPrice')) missing.push('Entry Price');
    if (!mappedFields.has('quantity')) missing.push('Quantity');
    if (!mappedFields.has('openedAt')) missing.push('Date');

    if (missing.length > 0) {
      this.errorRows.set([{ row: 0, reason: `Missing required columns: ${missing.join(', ')}` }]);
      this.validTrades.set([]);
      return;
    }

    const valid: ParsedTrade[] = [];
    const errors: RowError[] = [];

    rows.forEach((row, i) => {
      const mapped: any = {};
      for (const [origCol, field] of Object.entries(headerMap)) {
        mapped[field] = row[origCol];
      }

      try {
        const trade = this.validateRow(mapped, i + 2); // +2 for header + 0-index
        valid.push(trade);
      } catch (err: any) {
        errors.push({ row: i + 2, reason: err.message });
      }
    });

    this.validTrades.set(valid);
    this.errorRows.set(errors);
    this.previewData.set(valid.slice(0, 5));
  }

  validateRow(raw: any, rowNum: number): ParsedTrade {
    // Symbol
    const symbol = String(raw.symbol || '').trim().toUpperCase();
    if (!symbol) throw new Error('Symbol is empty');

    // Direction
    const dirRaw = String(raw.direction || '').trim().toLowerCase();
    const direction = DIRECTION_MAP[dirRaw];
    if (!direction) throw new Error(`Invalid direction '${raw.direction}'. Use Long/Short or Buy/Sell`);

    // Entry Price
    const entryPrice = parseFloat(raw.entryPrice);
    if (isNaN(entryPrice) || entryPrice <= 0) throw new Error(`Invalid entry price '${raw.entryPrice}'`);

    // Quantity
    const quantity = parseFloat(raw.quantity);
    if (isNaN(quantity) || quantity <= 0) throw new Error(`Invalid quantity '${raw.quantity}'`);

    // Date
    const openedAt = this.parseDate(raw.openedAt);
    if (!openedAt) throw new Error(`Invalid date '${raw.openedAt}'`);

    // Optional: Trade Type
    let tradeType = 'EQUITY';
    if (raw.tradeType) {
      const typeRaw = String(raw.tradeType).trim().toLowerCase();
      tradeType = TRADE_TYPE_MAP[typeRaw] || 'EQUITY';
    }

    // Optional numbers
    const exitPrice = raw.exitPrice ? parseFloat(raw.exitPrice) : undefined;
    if (exitPrice !== undefined && (isNaN(exitPrice) || exitPrice <= 0))
      throw new Error(`Invalid exit price '${raw.exitPrice}'`);

    const stopLoss = raw.stopLoss ? parseFloat(raw.stopLoss) : undefined;
    const takeProfit = raw.takeProfit ? parseFloat(raw.takeProfit) : undefined;
    const fees = raw.fees ? parseFloat(raw.fees) : undefined;
    const closedAt = raw.closedAt ? this.parseDate(raw.closedAt) ?? undefined : undefined;

    // Tags
    let tags: string[] | undefined;
    if (raw.tags) {
      tags = String(raw.tags).split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    return {
      symbol, tradeType, direction, entryPrice, exitPrice: exitPrice ?? undefined,
      quantity, stopLoss, takeProfit, fees,
      openedAt, closedAt,
      notes: raw.notes ? String(raw.notes) : undefined,
      tags,
    };
  }

  parseDate(val: any): string | null {
    if (!val) return null;
    if (val instanceof Date) return val.toISOString();
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
    // Try DD/MM/YYYY
    const parts = String(val).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (parts) {
      const d2 = new Date(`${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
      if (!isNaN(d2.getTime())) return d2.toISOString();
    }
    return null;
  }

  doImport() {
    this.step.set('importing');
    this.tradeService.importTrades(this.validTrades()).subscribe({
      next: (result) => {
        this.importResult.set(result);
        this.step.set('result');
      },
      error: () => {
        this.importResult.set({ imported: 0, failed: this.validTrades().length, errors: ['Server error'] });
        this.step.set('result');
      },
    });
  }

  downloadTemplate() {
    const template = [
      { Symbol: 'AAPL', Direction: 'Long', 'Entry Price': 185.50, 'Exit Price': 192.30, Quantity: 10, 'Stop Loss': 182, 'Take Profit': 195, Fees: 2.50, Date: '2024-06-15', 'Close Date': '2024-06-18', Type: 'Equity', Notes: 'Breakout trade', Tags: 'momentum,breakout' },
      { Symbol: 'BTCUSD', Direction: 'Short', 'Entry Price': 67500, 'Exit Price': 65200, Quantity: 0.5, 'Stop Loss': 68500, 'Take Profit': 64000, Fees: 15, Date: '2024-06-20', 'Close Date': '2024-06-21', Type: 'Crypto', Notes: 'Bearish divergence', Tags: 'crypto,swing' },
      { Symbol: 'TSLA', Direction: 'Long', 'Entry Price': 178.25, 'Exit Price': '', Quantity: 25, 'Stop Loss': 170, 'Take Profit': 200, Fees: 0, Date: '2024-06-25', 'Close Date': '', Type: 'Equity', Notes: '', Tags: '' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trades');
    XLSX.writeFile(wb, 'trade_import_template.xlsx');
  }
}
