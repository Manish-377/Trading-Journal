import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector, runInInjectionContext } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  // Don't add token to auth requests (login/signup/refresh)
  if (req.url.includes('/auth/login') || req.url.includes('/auth/signup') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const authService = runInInjectionContext(injector, () => inject(AuthService));
  const token = authService.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return authService.refreshToken().pipe(
          switchMap(tokenRes => {
            const cloned = req.clone({
              setHeaders: { Authorization: `Bearer ${tokenRes.accessToken}` },
            });
            return next(cloned);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
