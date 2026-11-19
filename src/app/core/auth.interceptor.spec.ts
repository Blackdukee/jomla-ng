import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  let currentToken: string | null;
  let authServiceMock: {
    getToken: ReturnType<typeof vi.fn>;
    refreshAccessToken: ReturnType<typeof vi.fn>;
    clearAuth: ReturnType<typeof vi.fn>;
  };

  const apiBase = environment.apiUrl.replace(/\/+$/, '');

  beforeEach(() => {
    currentToken = 'access-token-1';
    authServiceMock = {
      getToken: vi.fn(() => currentToken),
      refreshAccessToken: vi.fn(),
      clearAuth: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches Bearer token to Jomla API requests', () => {
    http.get(`${apiBase}/offers`).subscribe();
    const req = httpMock.expectOne(`${apiBase}/offers`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token-1');
    req.flush([]);
  });

  it('does not attach Bearer token to external URLs or prefix-spoofed origins', () => {
    http.get('https://res.cloudinary.com/demo/image.jpg').subscribe();
    const cdnReq = httpMock.expectOne('https://res.cloudinary.com/demo/image.jpg');
    expect(cdnReq.request.headers.has('Authorization')).toBe(false);
    cdnReq.flush({});

    http.get(`${apiBase}evil.com/steal`).subscribe();
    const spoofReq = httpMock.expectOne(`${apiBase}evil.com/steal`);
    expect(spoofReq.request.headers.has('Authorization')).toBe(false);
    spoofReq.flush({});
  });

  it('does not attach Bearer token or refresh on excluded auth endpoints', () => {
    const excluded = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];

    for (const path of excluded) {
      let receivedStatus = 0;
      http.post(`${apiBase}${path}`, {}).subscribe({
        error: (err: HttpErrorResponse) => {
          receivedStatus = err.status;
        }
      });

      const req = httpMock.expectOne(`${apiBase}${path}`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ detail: 'Rejected' }, { status: 401, statusText: 'Unauthorized' });
      expect(receivedStatus).toBe(401);
    }

    expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('refreshes token on 401 and retries the request once with the new Bearer token', () => {
    authServiceMock.refreshAccessToken.mockReturnValue(of({ token: 'refreshed-token-2' }));

    let responseBody: unknown;
    http.get(`${apiBase}/batches/my-hubs`).subscribe(res => {
      responseBody = res;
    });

    const firstReq = httpMock.expectOne(`${apiBase}/batches/my-hubs`);
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer access-token-1');
    firstReq.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refreshAccessToken).toHaveBeenCalledTimes(1);

    const retryReq = httpMock.expectOne(`${apiBase}/batches/my-hubs`);
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer refreshed-token-2');
    retryReq.flush([{ id: 'hub-1' }]);

    expect(responseBody).toEqual([{ id: 'hub-1' }]);
    expect(authServiceMock.clearAuth).not.toHaveBeenCalled();
  });

  it('does not trigger a second refresh if the retried request still returns 401', () => {
    authServiceMock.refreshAccessToken.mockReturnValue(of({ token: 'refreshed-token-2' }));

    let finalStatus = 0;
    http.get(`${apiBase}/batches/my-hubs`).subscribe({
      error: (err: HttpErrorResponse) => {
        finalStatus = err.status;
      }
    });

    httpMock.expectOne(`${apiBase}/batches/my-hubs`).flush({}, { status: 401, statusText: 'Unauthorized' });
    const retryReq = httpMock.expectOne(`${apiBase}/batches/my-hubs`);
    retryReq.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(finalStatus).toBe(401);
    expect(authServiceMock.clearAuth).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears auth and redirects to /login when refreshAccessToken fails with 401', () => {
    authServiceMock.refreshAccessToken.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
    );

    let failedStatus = 0;
    http.get(`${apiBase}/notifications`).subscribe({
      error: (err: HttpErrorResponse) => {
        failedStatus = err.status;
      }
    });

    httpMock.expectOne(`${apiBase}/notifications`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(failedStatus).toBe(401);
    expect(authServiceMock.clearAuth).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
