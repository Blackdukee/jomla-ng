import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * HTTP interceptor that:
 * 1. Attaches the Bearer JWT token to all outgoing requests
 * 2. On 401 responses, attempts a silent token refresh and retries the original request
 * 3. On refresh failure, clears auth state (handled by AuthService)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attach token (exclude auth endpoints)
  const token = localStorage.getItem('jomla_token');
  let authReq = req;
  const isAuthEndpoint = req.url.includes('/auth/login') ||
                         req.url.includes('/auth/register') ||
                         req.url.includes('/auth/refresh');

  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only attempt refresh on 401 and not on auth endpoints (to avoid infinite loop)
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register') &&
        !req.url.includes('/auth/refresh')
      ) {
        return authService.refreshAccessToken().pipe(
          switchMap(() => {
            // Retry the original request with the new token
            const newToken = localStorage.getItem('jomla_token');
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken ?? ''}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            authService.clearAuth();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
