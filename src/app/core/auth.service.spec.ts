import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from './models';
import { SignalRService } from './services/signalr.service';
import { environment } from '../../environments/environment';

function makeJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

function makeAuthResponse(roleClaim: string, isMsClaim = false): AuthResponse {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = isMsClaim
    ? { exp, 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': roleClaim }
    : { exp, role: roleClaim };

  return {
    token: makeJwt(payload),
    userId: 'user-123',
    email: 'user@jomla.test',
    firstName: 'Nadia',
    lastName: 'Hassan',
    refreshTokenExpiresOn: new Date(Date.now() + 86400000).toISOString()
  };
}

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let signalRMock: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };
  let service: AuthService | undefined;
  const baseUrl = `${environment.apiUrl}/auth`;

  const initService = () => {
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    return service;
  };

  beforeEach(() => {
    localStorage.clear();
    signalRMock = {
      connect: vi.fn(),
      disconnect: vi.fn()
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SignalRService, useValue: signalRMock }
      ]
    });
  });

  afterEach(() => {
    service?.clearAuth();
    service = undefined;
    httpMock?.verify();
    localStorage.clear();
  });

  it('does not issue /auth/refresh on anonymous startup without jomla_has_session', () => {
    const auth = initService();
    httpMock.expectNone(`${baseUrl}/refresh`);
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getToken()).toBeNull();
  });

  it('triggers a single silent /auth/refresh on startup when jomla_has_session is set', () => {
    localStorage.setItem('jomla_has_session', '1');
    const auth = initService();

    const req = httpMock.expectOne(`${baseUrl}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(makeAuthResponse('Buyer'));

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.isBuyer()).toBe(true);
    expect(signalRMock.connect).toHaveBeenCalled();
  });

  it('decodes Buyer, Supplier, and Admin roles (standard and MS claim URIs) and persists session on login', () => {
    const auth = initService();

    auth.loginWithData({ email: 's@jomla.test', password: 'secret' }).subscribe();
    httpMock.expectOne(`${baseUrl}/login`).flush(makeAuthResponse('Supplier', true));

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.isSupplier()).toBe(true);
    expect(auth.isBuyer()).toBe(false);
    expect(auth.isAdmin()).toBe(false);
    expect(auth.user()?.role).toBe('Supplier');
    expect(auth.displayName).toBe('Nadia Hassan');
    expect(localStorage.getItem('jomla_has_session')).toBe('1');
    expect(localStorage.getItem('jomla_token')).toBeTruthy();
    expect(signalRMock.connect).toHaveBeenCalled();

    auth.loginWithData({ email: 'a@jomla.test', password: 'secret' }).subscribe();
    httpMock.expectOne(`${baseUrl}/login`).flush(makeAuthResponse('Admin', false));
    expect(auth.isAdmin()).toBe(true);
    expect(auth.user()?.role).toBe('Admin');
  });

  it('deduplicates concurrent refreshAccessToken() calls into a single HTTP request', () => {
    const auth = initService();
    const responses: AuthResponse[] = [];

    auth.refreshAccessToken().subscribe(res => responses.push(res));
    auth.refreshAccessToken().subscribe(res => responses.push(res));

    const reqs = httpMock.match(`${baseUrl}/refresh`);
    expect(reqs).toHaveLength(1);

    const payload = makeAuthResponse('Buyer');
    reqs[0].flush(payload);

    expect(responses).toHaveLength(2);
    expect(responses[0].token).toBe(payload.token);
    expect(responses[1].token).toBe(payload.token);
  });

  it('clears state, localStorage, and disconnects SignalR on logout()', () => {
    const auth = initService();
    auth.loginWithData({ email: 'b@jomla.test', password: 'secret' }).subscribe();
    httpMock.expectOne(`${baseUrl}/login`).flush(makeAuthResponse('Buyer'));

    signalRMock.disconnect.mockClear();
    auth.logout().subscribe();
    const logoutReq = httpMock.expectOne(`${baseUrl}/logout`);
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush(null);

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getToken()).toBeNull();
    expect(localStorage.getItem('jomla_token')).toBeNull();
    expect(localStorage.getItem('jomla_user')).toBeNull();
    expect(localStorage.getItem('jomla_has_session')).toBeNull();
    expect(signalRMock.disconnect).toHaveBeenCalledTimes(1);
  });
});
