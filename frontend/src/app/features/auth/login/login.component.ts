import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { CandleBgComponent } from '../../../shared/candle-bg/candle-bg.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    CandleBgComponent,
  ],
  template: `
    <div class="auth-container">
      <app-candle-bg [opacity]="0.12"></app-candle-bg>
      <mat-card class="auth-card">
        <div class="brand">
          <mat-icon class="brand-icon">candlestick_chart</mat-icon>
          <h1>Trading Journal</h1>
          <p class="subtitle">Welcome back</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="Enter your email">
            <mat-icon matPrefix>email</mat-icon>
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <mat-error>Valid email is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Enter your password">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <mat-error>Password is required</mat-error>
            }
          </mat-form-field>

          @if (errorMessage()) {
            <div class="error-banner">
              <mat-icon>error_outline</mat-icon> {{ errorMessage() }}
            </div>
          }

          <button mat-raised-button color="primary" class="login-btn" type="submit" [disabled]="form.invalid || isLoading()">
            @if (isLoading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Login
            }
          </button>
        </form>

        <p class="auth-link">
          Don't have an account? <a routerLink="/signup">Sign up</a>
        </p>
      </mat-card>
      <p class="slogan">made by <span class="hl">trader</span>, for <span class="hl">traders</span></p>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      min-height: 100vh; background: #0b1220;
      position: relative; overflow: hidden;
    }
    .auth-card { position: relative; z-index: 1; }
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px #1a2332 inset !important;
      -webkit-text-fill-color: #c7e2f7 !important;
      caret-color: #c7e2f7;
      transition: background-color 5000s ease-in-out 0s;
    }
    .slogan {
      color: #3a4858; font-size: 0.75rem; font-style: italic;
      letter-spacing: 1.5px; margin-top: 1.5rem;
    }
    .slogan .hl { color: #0ea5e9; font-weight: 600; }
    .auth-card {
      width: 100%; max-width: 440px; padding: 3rem 2.5rem;
    }
    .brand { text-align: center; margin-bottom: 2rem; }
    .brand-icon { font-size: 48px; width: 48px; height: 48px; color: #0ea5e9; }
    .brand h1 {
      color: #c7e2f7; font-size: 1.8rem; font-weight: 700;
      margin: 0.5rem 0 0.25rem; letter-spacing: -0.5px;
    }
    .subtitle { color: #5a6472; font-size: 1rem; margin: 0; }
    .full-width { width: 100%; }
    .error-banner {
      display: flex; align-items: center; gap: 0.5rem;
      background: rgba(248, 113, 113, 0.1); color: #f87171; padding: 0.75rem 1rem;
      border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(248, 113, 113, 0.3);
      font-size: 0.9rem;
    }
    .login-btn { width: 100%; padding: 0.6rem; font-size: 1rem; margin-top: 0.5rem; transition: all 0.2s ease; }
    .login-btn:hover:not([disabled]) { filter: brightness(1.3); transform: translateY(-1px); box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4); }
    .auth-link {
      text-align: center; margin-top: 1.5rem; color: #5a6472; font-size: 0.9rem;
    }
    .auth-link a { color: #0ea5e9; text-decoration: none; font-weight: 500; }
    .auth-link a:hover { text-decoration: underline; }
  `],
})
export class LoginComponent {
  form: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.value;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please try again.');
      },
    });
  }
}
