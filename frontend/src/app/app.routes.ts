import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'trades',
        loadComponent: () => import('./features/trades/trade-list/trade-list.component').then(m => m.TradeListComponent),
      },
      {
        path: 'trades/new',
        loadComponent: () => import('./features/trades/trade-form/trade-form.component').then(m => m.TradeFormComponent),
      },
      {
        path: 'trades/:id',
        loadComponent: () => import('./features/trades/trade-detail/trade-detail.component').then(m => m.TradeDetailComponent),
      },
      {
        path: 'strategies',
        loadComponent: () => import('./features/strategies/strategy-list/strategy-list.component').then(m => m.StrategyListComponent),
      },
      {
        path: 'strategies/new',
        loadComponent: () => import('./features/strategies/strategy-form/strategy-form.component').then(m => m.StrategyFormComponent),
      },
      {
        path: 'strategies/:id',
        loadComponent: () => import('./features/strategies/strategy-form/strategy-form.component').then(m => m.StrategyFormComponent),
      },
      {
        path: 'mistakes',
        loadComponent: () => import('./features/mistakes/mistake-list/mistake-list.component').then(m => m.MistakeListComponent),
      },
      {
        path: 'mistakes/new',
        loadComponent: () => import('./features/mistakes/mistake-form/mistake-form.component').then(m => m.MistakeFormComponent),
      },
      {
        path: 'mistakes/:id',
        loadComponent: () => import('./features/mistakes/mistake-form/mistake-form.component').then(m => m.MistakeFormComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
