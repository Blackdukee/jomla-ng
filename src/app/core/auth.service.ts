import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize, shareReplay } from 'rxjs';
import { AuthResponse, User, RegisterRequest } from './models/auth.models';
import { SignalRService } from './services/signalr.service';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private signalR = inject(SignalRService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  /** Handle for the proactive refresh timer so we can cancel it on logout. */
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshInProgress$: Observable<AuthResponse> | null = null;

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  
  readonly isBuyer = computed(() => {
    const token = this._token();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    if (!decoded) return false;
    const claim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"];
    const roleStr = Array.isArray(claim) ? claim[0] : claim;
    return roleStr?.toLowerCase() === 'buyer';
  });

  readonly isSupplier = computed(() => {
    const token = this._token();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    if (!decoded) return false;
    const claim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"];
    const roleStr = Array.isArray(claim) ? claim[0] : claim;
    return roleStr?.toLowerCase() === 'supplier';
  });

  readonly isAdmin = computed(() => {
    const token = this._token();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    if (!decoded) return false;
    const claim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"];
    const roleStr = Array.isArray(claim) ? claim[0] : claim;
    return roleStr?.toLowerCase() === 'admin';
  });

  constructor() {
    // Restore from localStorage
    const storedUser = localStorage.getItem('jomla_user');
    const storedToken = localStorage.getItem('jomla_token');

    if (storedUser && storedToken) {
      try {
        this._user.set(JSON.parse(storedUser));
        this._token.set(storedToken);
        
        // If token is expired or close to expiring (within 2 minutes), refresh it.
        // Otherwise, keep the user logged in and connect SignalR.
        if (this.isTokenExpired(storedToken)) {
          this.refreshAccessToken().subscribe({
            next: () => {
              this.signalR.connect();
            },
            error: (err) => {
              if (err.status === 401 || err.status === 400) {
                this.clearAuthState();
              }
            }
          });
        } else {
          this.signalR.connect();
          this.scheduleTokenRefresh(storedToken);
        }
      } catch {
        this.clearAuthState();
      }
    } else {
      // If we don't have token/user in storage, try silent login via cookie
      this.refreshAccessToken().subscribe({
        next: () => {
          this.signalR.connect();
        },
        error: (err) => {
          if (err.status === 401 || err.status === 400) {
            this.clearAuthState();
          }
        }
      });
    }

    // Listen for tab focus/visibility changes to handle cases where background tab setTimeout was throttled
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const handleVisibilityOrFocus = () => {
        const token = this._token();
        if (token && this.isAuthenticated()) {
          this.checkAndRefreshIfCloseToExpiry(token);
        }
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          handleVisibilityOrFocus();
        }
      });
      window.addEventListener('focus', handleVisibilityOrFocus);
    }
  }

private handleAuthSuccess(res: AuthResponse) {
  // Determine role from JWT claims
  let role: 'Buyer' | 'Supplier' | 'Admin' = 'Buyer';
  const decoded = this.decodeToken(res.token);
  if (decoded) {
    const claim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"];
    const roleStr = Array.isArray(claim) ? claim[0] : claim;
    if (roleStr?.toLowerCase() === 'supplier') {
      role = 'Supplier';
    } else if (roleStr?.toLowerCase() === 'admin') {
      role = 'Admin';
    }
  }

  const u: User = {
    id: res.userId,
    firstName: res.firstName,
    lastName: res.lastName,
    email: res.email,
    role: role,
    imageUrl: res.imageUrl   // ⬅️ جديد
  };

  this._user.set(u);
  this._token.set(res.token);
  localStorage.setItem('jomla_user', JSON.stringify(u));
  localStorage.setItem('jomla_token', res.token);

  // Connect SignalR with fresh token
  this.signalR.connect();

  // Schedule a silent refresh before the token expires
  this.scheduleTokenRefresh(res.token);
}

  private clearAuthState() {
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem('jomla_user');
    localStorage.removeItem('jomla_token');
    this.signalR.disconnect();
    // Cancel any pending proactive refresh so it doesn't fire after logout
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  clearAuth() {
    this.clearAuthState();
  }

  updateUser(u: User) {
    this._user.set(u);
    localStorage.setItem('jomla_user', JSON.stringify(u));
  }

  loginWithData(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, {
      email: data.email,
      password: data.password
    }, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  registerBuyer(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      ...data,
      role: 'Buyer'
    }, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  registerSupplier(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      ...data,
      role: 'Supplier'
    }, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  refreshAccessToken(): Observable<AuthResponse> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    this.refreshInProgress$ = this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res)),
      finalize(() => {
        this.refreshInProgress$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshInProgress$;
  }

  private checkAndRefreshIfCloseToExpiry(token: string): void {
    if (this.isTokenExpired(token)) {
      this.refreshAccessToken().subscribe({
        error: (err) => {
          if (err.status === 401 || err.status === 400) {
            this.clearAuthState();
          }
        }
      });
    } else {
      // Re-schedule the timer based on updated remaining time calculation
      this.scheduleTokenRefresh(token);
    }
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).pipe(
      finalize(() => {
        this.clearAuthState();
      })
    );
  }

  /** Get the display name for the current user */
  get displayName(): string {
    const u = this._user();
    if (!u) return '';
    return `${u.firstName} ${u.lastName}`;
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Schedules a silent token refresh 2 minutes before the JWT expires.
   * Each call cancels the previous timer, so only one is ever pending.
   */
  private scheduleTokenRefresh(token: string): void {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return;

    const expiresAtMs = decoded.exp * 1000;
    const refreshAtMs = expiresAtMs - 2 * 60 * 1000; // 2 min before expiry
    const delayMs     = refreshAtMs - Date.now();

    // Cancel any existing timer before scheduling a new one
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (delayMs <= 0) {
      // Token is already expired or within the 2-min buffer — refresh now
      this.refreshAccessToken().subscribe({
        error: (err) => {
          if (err.status === 401 || err.status === 400) {
            this.clearAuthState();
          }
        }
      });
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      this.refreshAccessToken().subscribe({
        error: (err) => {
          if (err.status === 401 || err.status === 400) {
            this.clearAuthState();
          } else {
            // Transient error (e.g. server restarting). Retry in 15 seconds.
            this.refreshTimer = setTimeout(() => this.scheduleTokenRefresh(token), 15000);
          }
        }
      });
    }, delayMs);
  }

  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    const expirationDate = decoded.exp * 1000;
    const buffer = 2 * 60 * 1000; // 2 minutes buffer
    return Date.now() >= (expirationDate - buffer);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(data: { email: string; token: string; newPassword: string; confirmPassword: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, data);
  }
}
