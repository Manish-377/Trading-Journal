import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MistakeService } from '../../../core/services/mistake.service';
import { StrategyService } from '../../../core/services/strategy.service';
import { Strategy } from '../../../core/models/strategy.model';
import { MistakeCategory, Severity } from '../../../core/models/mistake.model';

@Component({
  selector: 'app-mistake-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ isEdit() ? 'Edit Mistake' : 'Log Mistake' }}</h1>
        <a routerLink="/mistakes" mat-button>
          <mat-icon>arrow_back</mat-icon> Back
        </a>
      </div>

      <mat-card class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                @for (cat of categories; track cat) {
                  <mat-option [value]="cat">{{ formatCategory(cat) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Severity</mat-label>
              <mat-select formControlName="severity">
                <mat-option value="LOW">Low</mat-option>
                <mat-option value="MEDIUM">Medium</mat-option>
                <mat-option value="HIGH">High</mat-option>
                <mat-option value="CRITICAL">Critical</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>What happened?</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Describe the mistake in detail..."></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Lesson learned</mat-label>
            <textarea matInput formControlName="lesson" rows="3" placeholder="What will you do differently next time?"></textarea>
            <mat-icon matPrefix>lightbulb</mat-icon>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Linked Strategy</mat-label>
              <mat-select formControlName="strategyId">
                <mat-option value="">None</mat-option>
                @for (s of strategies(); track s.id) {
                  <mat-option [value]="s.id">{{ s.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Trade ID (optional)</mat-label>
              <input matInput formControlName="tradeId" placeholder="Paste trade ID">
            </mat-form-field>
          </div>

          @if (error()) {
            <div class="error-banner">
              <mat-icon>error</mat-icon> {{ error() }}
            </div>
          }

          <div class="actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              @if (saving()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>save</mat-icon>
                {{ isEdit() ? 'Update' : 'Log Mistake' }}
              }
            </button>
            <a routerLink="/mistakes" mat-stroked-button>Cancel</a>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 1.5rem; max-width: 650px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h1 { color: #c7e2f7; font-size: 1.75rem; font-weight: 600; }
    .form-card { padding: 2rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .full-width { width: 100%; }
    .error-banner {
      display: flex; align-items: center; gap: 0.5rem;
      background: rgba(248, 113, 113, 0.1); color: #f87171; padding: 0.75rem 1rem;
      border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(248, 113, 113, 0.3);
    }
    .actions { display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem; }
  `]
})
export class MistakeFormComponent implements OnInit {
  form: FormGroup;
  isEdit = signal(false);
  saving = signal(false);
  error = signal('');
  strategies = signal<Strategy[]>([]);
  private mistakeId: string | null = null;

  categories: MistakeCategory[] = [
    'FOMO', 'OVERTRADING', 'NO_STOP_LOSS', 'MOVED_STOP_LOSS', 'EARLY_EXIT',
    'LATE_ENTRY', 'REVENGE_TRADE', 'POSITION_SIZE', 'IGNORED_RULES', 'EMOTIONAL', 'OTHER'
  ];

  constructor(
    private fb: FormBuilder,
    private mistakeService: MistakeService,
    private strategyService: StrategyService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      category: ['FOMO', Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]],
      lesson: [''],
      severity: ['MEDIUM'],
      strategyId: [''],
      tradeId: [''],
    });
  }

  ngOnInit() {
    this.strategyService.getAll(true).subscribe({
      next: (s) => this.strategies.set(s),
    });

    this.mistakeId = this.route.snapshot.paramMap.get('id');
    if (this.mistakeId) {
      this.isEdit.set(true);
      this.mistakeService.getOne(this.mistakeId).subscribe({
        next: (m) => {
          this.form.patchValue({
            category: m.category,
            description: m.description,
            lesson: m.lesson || '',
            severity: m.severity,
            strategyId: m.strategyId || '',
            tradeId: m.tradeId || '',
          });
        },
        error: () => this.router.navigate(['/mistakes']),
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');

    const val = this.form.value;
    const payload: any = {
      category: val.category,
      description: val.description,
      severity: val.severity,
    };
    if (val.lesson) payload.lesson = val.lesson;
    if (val.strategyId) payload.strategyId = val.strategyId;
    if (val.tradeId) payload.tradeId = val.tradeId;

    const req = this.isEdit()
      ? this.mistakeService.update(this.mistakeId!, payload)
      : this.mistakeService.create(payload);

    req.subscribe({
      next: () => this.router.navigate(['/mistakes']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to save');
      },
    });
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
