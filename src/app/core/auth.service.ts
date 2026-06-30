import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { AuthResponse, User, RegisterRequest } from './models/auth.models';
import { SignalRService } from './services/signalr.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private signalR = inject(SignalRService);
  private readonly baseUrl = 'http://localhost:5174/api/auth';

  private _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isBuyer = computed(() => this._user()?.role === 'Buyer');
  readonly isSupplier = computed(() => this._user()?.role === 'Supplier');

  constructor() {
    // Restore from localStorage
    const storedUser = localStorage.getItem('jomla_user');
    const storedToken = localStorage.getItem('jomla_token');

    if (storedUser && storedToken) {
      try {
        this._user.set(JSON.parse(storedUser));
        
        // If token is expired or close to expiring (within 2 minutes), refresh it.
        // Otherwise, keep the user logged in and connect SignalR.
        if (this.isTokenExpired(storedToken)) {
          this.refreshAccessToken().subscribe({
            next: () => {
              this.signalR.connect();
            },
            error: () => {
              this.clearAuthState();
            }
          });
        } else {
          this.signalR.connect();
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
        error: () => {
          this.clearAuthState();
        }
      });
    }
  }

  private handleAuthSuccess(res: AuthResponse) {
    // Determine role from JWT claims
    let role: 'Buyer' | 'Supplier' = 'Buyer';
    const decoded = this.decodeToken(res.token);
    if (decoded) {
      const claim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"];
      const roleStr = Array.isArray(claim) ? claim[0] : claim;
      if (roleStr?.toLowerCase() === 'supplier') {
        role = 'Supplier';
      }
    }

    const u: User = {
      id: res.userId,
      firstName: res.firstName,
      lastName: res.lastName,
      email: res.email,
      role: role
    };

    this._user.set(u);
    localStorage.setItem('jomla_user', JSON.stringify(u));
    localStorage.setItem('jomla_token', res.token);

    // Connect SignalR with fresh token
    this.signalR.connect();
  }

  private clearAuthState() {
    this._user.set(null);
    localStorage.removeItem('jomla_user');
    localStorage.removeItem('jomla_token');
    this.signalR.disconnect();
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
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
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
      const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
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
