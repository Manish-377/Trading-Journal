import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StrategyService } from '../../../core/services/strategy.service';

@Component({
  selector: 'app-strategy-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCardModule, MatCheckboxModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ isEdit() ? 'Edit Strategy' : 'New Strategy' }}</h1>
        <a routerLink="/strategies" mat-button>
          <mat-icon>arrow_back</mat-icon> Back
        </a>
      </div>

      <mat-card class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Breakout Strategy">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Describe your strategy..."></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Rules (one per line)</mat-label>
            <textarea matInput formControlName="rulesText" rows="5" placeholder="Wait for confirmation candle&#10;Risk max 2% per trade&#10;Only trade during market hours"></textarea>
            <mat-hint>Each line becomes a rule</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tags</mat-label>
            <input matInput formControlName="tagsText" placeholder="e.g. momentum, intraday, trending">
            <mat-hint>Comma separated</mat-hint>
          </mat-form-field>

          <div class="checkbox-row">
            <mat-checkbox formControlName="isActive" color="primary">Active Strategy</mat-checkbox>
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
                {{ isEdit() ? 'Update Strategy' : 'Create Strategy' }}
              }
            </button>
            <a routerLink="/strategies" mat-stroked-button>Cancel</a>
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
    .full-width { width: 100%; }
    .checkbox-row { margin-bottom: 1.5rem; }
    .error-banner {
      display: flex; align-items: center; gap: 0.5rem;
      background: rgba(248, 113, 113, 0.1); color: #f87171; padding: 0.75rem 1rem;
      border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(248, 113, 113, 0.3);
    }
    .actions { display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem; }
  `]
})
export class StrategyFormComponent implements OnInit {
  form: FormGroup;
  isEdit = signal(false);
  saving = signal(false);
  error = signal('');
  private strategyId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private strategyService: StrategyService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      rulesText: [''],
      tagsText: [''],
      isActive: [true],
    });
  }

  ngOnInit() {
    this.strategyId = this.route.snapshot.paramMap.get('id');
    if (this.strategyId) {
      this.isEdit.set(true);
      this.strategyService.getOne(this.strategyId).subscribe({
        next: (s) => {
          this.form.patchValue({
            name: s.name,
            description: s.description || '',
            rulesText: s.rules.join('\n'),
            tagsText: s.tags.join(', '),
            isActive: s.isActive,
          });
        },
        error: () => this.router.navigate(['/strategies']),
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');

    const { name, description, rulesText, tagsText, isActive } = this.form.value;
    const payload = {
      name,
      description: description || undefined,
      rules: rulesText ? rulesText.split('\n').map((r: string) => r.trim()).filter((r: string) => r) : [],
      tags: tagsText ? tagsText.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      isActive,
    };

    const req = this.isEdit()
      ? this.strategyService.update(this.strategyId!, payload)
      : this.strategyService.create(payload);

    req.subscribe({
      next: () => this.router.navigate(['/strategies']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to save strategy');
      },
    });
  }
}
