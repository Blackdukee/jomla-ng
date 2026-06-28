import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Global state variables for interceptor instance
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * HTTP interceptor that:
 * 1. Attaches the Bearer JWT token to all outgoing requests
 * 2. On 401 responses, locks and attempts a silent token refresh, queuing other concurrent requests
 * 3. On refresh success, retries all queued requests with the new token
 * 4. On refresh failure, clears auth state and redirects to login
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
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshAccessToken().pipe(
            switchMap((res) => {
              isRefreshing = false;
              refreshTokenSubject.next(res.token);
              
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${res.token}`
                }
              });
              return next(retryReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authService.clearAuth();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // Queue request until token is refreshed
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((newToken) => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(retryReq);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
