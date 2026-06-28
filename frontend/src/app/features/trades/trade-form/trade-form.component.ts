import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { provideNativeDateAdapter } from '@angular/material/core';
import { forkJoin } from 'rxjs';
import { TradeService } from '../../../core/services/trade.service';
import { StrategyService } from '../../../core/services/strategy.service';
import { Strategy } from '../../../core/models/strategy.model';
import { SYMBOLS, SymbolItem } from '../../../core/data/symbols';

@Component({
  selector: 'app-trade-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatAutocompleteModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="form-container">
      <div class="form-header">
        <h1>New Trade</h1>
        <a routerLink="/trades" mat-button>
          <mat-icon>arrow_back</mat-icon> Back
        </a>
      </div>

      <mat-card class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-section">
            <h3 class="section-title">Trade Details</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Symbol</mat-label>
                <input matInput formControlName="symbol" placeholder="Search e.g. BTC, NIFTY, AAPL"
                       [matAutocomplete]="symbolAuto" (input)="filterSymbols($event)">
                <mat-icon matSuffix>search</mat-icon>
                <mat-autocomplete #symbolAuto="matAutocomplete" (optionSelected)="onSymbolSelected($event.option.value)">
                  @for (s of filteredSymbols(); track s.symbol) {
                    <mat-option [value]="s.symbol">
                      <span class="symbol-option">
                        <strong>{{ s.symbol }}</strong>
                        <small>{{ s.name }}</small>
                      </span>
                    </mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Trade Type</mat-label>
                <mat-select formControlName="tradeType">
                  <mat-option value="EQUITY">Equity</mat-option>
                  <mat-option value="OPTIONS">Options</mat-option>
                  <mat-option value="FUTURES">Futures</mat-option>
                  <mat-option value="FOREX">Forex</mat-option>
                  <mat-option value="CRYPTO">Crypto</mat-option>
                  <mat-option value="COMMODITY">Commodity</mat-option>
                  <mat-option value="INDEX">Index</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Direction</mat-label>
                <mat-select formControlName="direction">
                  <mat-option value="LONG">Long</mat-option>
                  <mat-option value="SHORT">Short</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Pricing</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Entry Price</mat-label>
                <input matInput type="number" formControlName="entryPrice" step="0.01">
                <mat-icon matPrefix>attach_money</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Exit Price</mat-label>
                <input matInput type="number" formControlName="exitPrice" step="0.01" placeholder="Leave empty if open">
                <mat-icon matPrefix>attach_money</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Quantity</mat-label>
                <input matInput type="number" formControlName="quantity" step="0.01">
              </mat-form-field>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Risk Management</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Stop Loss</mat-label>
                <input matInput type="number" formControlName="stopLoss" step="0.01">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Take Profit</mat-label>
                <input matInput type="number" formControlName="takeProfit" step="0.01">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fees</mat-label>
                <input matInput type="number" formControlName="fees" step="0.01">
              </mat-form-field>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Timing</h3>
            <div class="form-row timing-row">
              <mat-form-field appearance="outline">
                <mat-label>Opened Date</mat-label>
                <input matInput [matDatepicker]="openedPicker" formControlName="openedDate">
                <mat-datepicker-toggle matIconSuffix [for]="openedPicker"></mat-datepicker-toggle>
                <mat-datepicker #openedPicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" class="time-field">
                <mat-label>Hour</mat-label>
                <mat-select formControlName="openedHour">
                  @for (h of hours; track h) {
                    <mat-option [value]="h">{{ h }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="time-field">
                <mat-label>Min</mat-label>
                <mat-select formControlName="openedMinute">
                  @for (m of minutes; track m) {
                    <mat-option [value]="m">{{ m }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="form-row timing-row">
              <mat-form-field appearance="outline">
                <mat-label>Closed Date</mat-label>
                <input matInput [matDatepicker]="closedPicker" formControlName="closedDate">
                <mat-datepicker-toggle matIconSuffix [for]="closedPicker"></mat-datepicker-toggle>
                <mat-datepicker #closedPicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" class="time-field">
                <mat-label>Hour</mat-label>
                <mat-select formControlName="closedHour">
                  <mat-option value="">--</mat-option>
                  @for (h of hours; track h) {
                    <mat-option [value]="h">{{ h }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="time-field">
                <mat-label>Min</mat-label>
                <mat-select formControlName="closedMinute">
                  <mat-option value="">--</mat-option>
                  @for (m of minutes; track m) {
                    <mat-option [value]="m">{{ m }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Classification</h3>
            <div class="form-row two-col">
              <mat-form-field appearance="outline">
                <mat-label>Strategy</mat-label>
                <mat-select formControlName="strategyId">
                  <mat-option value="">No strategy linked</mat-option>
                  @for (s of strategies(); track s.id) {
                    <mat-option [value]="s.id">{{ s.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Tags</mat-label>
                <input matInput formControlName="tags" placeholder="e.g. breakout, earnings, momentum">
                <mat-hint>Comma separated</mat-hint>
              </mat-form-field>
            </div>
          </div>

          <div class="form-section">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3" placeholder="Trade reasoning, observations..."></textarea>
            </mat-form-field>
          </div>

          <div class="form-section">
            <h3 class="section-title">Screenshots</h3>
            <div class="image-upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
              <input #fileInput type="file" accept="image/*" multiple (change)="onFilesSelected($event)" hidden>
              <mat-icon class="upload-icon">add_photo_alternate</mat-icon>
              <p>Click or drag images here</p>
              <span class="upload-hint">PNG, JPG, WebP up to 5MB each</span>
            </div>
            @if (selectedFiles().length > 0) {
              <div class="image-previews">
                @for (preview of imagePreviews(); track preview.name) {
                  <div class="preview-item">
                    <img [src]="preview.url" [alt]="preview.name">
                    <button type="button" mat-icon-button class="remove-btn" (click)="removeFile(preview.name)">
                      <mat-icon>close</mat-icon>
                    </button>
                    <span class="preview-name">{{ preview.name }}</span>
                  </div>
                }
              </div>
            }
          </div>

          @if (errorMessage()) {
            <div class="error-banner">
              <mat-icon>error</mat-icon> {{ errorMessage() }}
            </div>
          }

          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || isLoading()">
              @if (isLoading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>save</mat-icon> Save Trade
              }
            </button>
            <a routerLink="/trades" mat-stroked-button>Cancel</a>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .symbol-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 1rem;
      strong { color: #c7e2f7; }
      small { color: #5a6472; font-size: 0.8rem; }
    }
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .form-header h1 {
      color: #c7e2f7;
      font-size: 1.75rem;
      font-weight: 600;
    }
    .form-card {
      padding: 2rem;
    }
    .form-section {
      margin-bottom: 1rem;
    }
    .section-title {
      color: #5a6472;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #1e2d3d;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .form-row.two-col {
      grid-template-columns: repeat(2, 1fr);
    }
    .form-row.timing-row {
      grid-template-columns: 2fr 1fr 1fr;
    }
    .time-field {
      min-width: 80px;
    }
    .full-width {
      width: 100%;
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(248, 113, 113, 0.1);
      color: #f87171;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      border: 1px solid rgba(248, 113, 113, 0.3);
    }
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
      .form-row.two-col { grid-template-columns: 1fr; }
    }
    .image-upload-area {
      border: 2px dashed #1e2d3d;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      &:hover {
        border-color: #0ea5e9;
        background: rgba(14, 165, 233, 0.05);
      }
      .upload-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #5a6472;
      }
      p {
        color: #c7e2f7;
        margin: 0.5rem 0 0.25rem;
        font-weight: 500;
      }
      .upload-hint {
        color: #5a6472;
        font-size: 0.8rem;
      }
    }
    .image-previews {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .preview-item {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #1e2d3d;
      background: #0b1220;
      img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        display: block;
      }
      .remove-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.7);
        color: #f87171;
        width: 24px;
        height: 24px;
        line-height: 24px;
        .mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
      .preview-name {
        display: block;
        padding: 4px 8px;
        font-size: 0.7rem;
        color: #8899a8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `],
})
export class TradeFormComponent implements OnInit {
  form: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  strategies = signal<Strategy[]>([]);
  selectedFiles = signal<File[]>([]);
  imagePreviews = signal<{ name: string; url: string }[]>([]);
  filteredSymbols = signal<SymbolItem[]>(SYMBOLS.slice(0, 10));

  constructor(
    private fb: FormBuilder,
    private tradeService: TradeService,
    private strategyService: StrategyService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      symbol: ['', Validators.required],
      tradeType: ['EQUITY', Validators.required],
      direction: ['LONG', Validators.required],
      entryPrice: [null, [Validators.required, Validators.min(0)]],
      exitPrice: [null],
      quantity: [null, [Validators.required, Validators.min(0)]],
      stopLoss: [null],
      takeProfit: [null],
      fees: [0],
      strategyId: [''],
      openedDate: [new Date(), Validators.required],
      openedHour: [this.getCurrentHour(), Validators.required],
      openedMinute: [this.getCurrentMinute(), Validators.required],
      closedDate: [null],
      closedHour: [''],
      closedMinute: [''],
      tags: [''],
      notes: [''],
    });
  }

  ngOnInit() {
    this.strategyService.getAll(true).subscribe({
      next: (s) => this.strategies.set(s),
    });
  }

  filterSymbols(event: Event) {
    const query = (event.target as HTMLInputElement).value.toUpperCase().trim();
    if (!query) {
      this.filteredSymbols.set(SYMBOLS.slice(0, 10));
      return;
    }
    this.filteredSymbols.set(
      SYMBOLS.filter(s =>
        s.symbol.includes(query) || s.name.toUpperCase().includes(query)
      ).slice(0, 15)
    );
  }

  onSymbolSelected(symbol: string) {
    const match = SYMBOLS.find(s => s.symbol === symbol);
    if (match) {
      const categoryToType: Record<string, string> = {
        forex: 'FOREX',
        crypto: 'CRYPTO',
        commodity: 'COMMODITY',
        index: 'INDEX',
        stock: 'EQUITY',
      };
      const tradeType = categoryToType[match.category] || 'EQUITY';
      this.form.get('tradeType')?.setValue(tradeType);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const val = this.form.value;
    const openedAt = this.combineDateAndTime(val.openedDate, val.openedHour, val.openedMinute);
    const payload: any = {
      symbol: val.symbol,
      tradeType: val.tradeType,
      direction: val.direction,
      entryPrice: Number(val.entryPrice),
      quantity: Number(val.quantity),
      fees: Number(val.fees) || 0,
      openedAt: openedAt.toISOString(),
    };

    if (val.exitPrice) payload.exitPrice = Number(val.exitPrice);
    if (val.stopLoss) payload.stopLoss = Number(val.stopLoss);
    if (val.takeProfit) payload.takeProfit = Number(val.takeProfit);
    if (val.closedDate && val.closedHour) {
      const closedAt = this.combineDateAndTime(val.closedDate, val.closedHour, val.closedMinute || '00');
      payload.closedAt = closedAt.toISOString();
    }
    if (val.notes) payload.notes = val.notes;
    if (val.tags) payload.tags = val.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    if (val.strategyId) payload.strategyId = val.strategyId;

    this.tradeService.create(payload).subscribe({
      next: (trade) => {
        if (this.selectedFiles().length > 0) {
          this.uploadImages(trade.id);
        } else {
          this.router.navigate(['/trades']);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to create trade');
        this.isLoading.set(false);
      },
    });
  }

  private uploadImages(tradeId: string) {
    const uploads = this.selectedFiles().map(file =>
      this.tradeService.uploadImage(tradeId, file)
    );
    forkJoin(uploads).subscribe({
      next: () => this.router.navigate(['/trades']),
      error: () => {
        // Trade created but images failed - still navigate
        this.router.navigate(['/trades']);
      },
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.dataTransfer?.files) return;
    const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    this.addFiles(files);
  }

  private addFiles(files: File[]) {
    const current = this.selectedFiles();
    const newFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    this.selectedFiles.set([...current, ...newFiles]);

    const previews = [...this.imagePreviews()];
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push({ name: file.name, url: reader.result as string });
        this.imagePreviews.set([...previews]);
      };
      reader.readAsDataURL(file);
    });
  }

  removeFile(name: string) {
    this.selectedFiles.set(this.selectedFiles().filter(f => f.name !== name));
    this.imagePreviews.set(this.imagePreviews().filter(p => p.name !== name));
  }

  hours = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
  minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  private getCurrentHour(): string {
    return new Date().getHours().toString().padStart(2, '0');
  }

  private getCurrentMinute(): string {
    const m = new Date().getMinutes();
    const rounded = Math.round(m / 5) * 5;
    return (rounded % 60).toString().padStart(2, '0');
  }

  private combineDateAndTime(date: Date, hour: string, minute: string): Date {
    const result = new Date(date);
    result.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
    return result;
  }
}
