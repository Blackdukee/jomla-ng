import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const IS_AUTH_RETRY = new HttpContextToken<boolean>(() => false);

const apiBase = environment.apiUrl.replace(/\/+$/, '');
const isApiUrl = (url: string): boolean =>
  url === apiBase || url.startsWith(`${apiBase}/`) || url.startsWith(`${apiBase}?`);

const AUTH_EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
];

/**
 * HTTP interceptor that:
 * 1. Attaches the Bearer JWT token strictly to outgoing Jomla API requests
 * 2. On 401 responses, delegates token refresh deduplication to AuthService
 * 3. Retries the failed request once with the refreshed token (guarded by IS_AUTH_RETRY)
 * 4. On refresh failure, clears auth state and redirects to login
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiUrl(req.url)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_EXCLUDED_PATHS.some(path => req.url.includes(path));
  const requestToken = authService.getToken();
  let authReq = req;

  if (requestToken && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${requestToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !isAuthEndpoint &&
        !req.context.get(IS_AUTH_RETRY)
      ) {
        const latestToken = authService.getToken();
        if (latestToken && latestToken !== requestToken) {
          return next(req.clone({
            setHeaders: {
              Authorization: `Bearer ${latestToken}`
            },
            context: req.context.set(IS_AUTH_RETRY, true)
          }));
        }

        return authService.refreshAccessToken().pipe(
          switchMap((res) => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.token}`
              },
              context: req.context.set(IS_AUTH_RETRY, true)
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            if (refreshError.status === 401 || refreshError.status === 400) {
              authService.clearAuth();
              if (!router.url.startsWith('/login')) {
                router.navigate(['/login']);
              }
            }
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
