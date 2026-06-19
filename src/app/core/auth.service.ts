import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from './mock-data';

interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  refreshTokenExpiresOn: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/auth';

  private _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isBuyer = computed(() => this._user()?.role === 'buyer');
  readonly isSupplier = computed(() => this._user()?.role === 'supplier');

  constructor() {
    // Restore from localStorage
    const storedUser = localStorage.getItem('jomla_user');
    if (storedUser) {
      try {
        this._user.set(JSON.parse(storedUser));
      } catch {}
    }

    // Try to refresh token on startup to ensure we are logged in and get a fresh access token
    this.refreshAccessToken().subscribe({
      error: () => {
        // If refresh fails, clear auth state
        this.clearAuthState();
      }
    });
  }

  private handleAuthSuccess(res: AuthResponse, roleClaim?: string) {
    let role: 'buyer' | 'supplier' = 'buyer';
    const decoded = this.decodeToken(res.token);
    if (decoded) {
      const claim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"];
      const roleStr = Array.isArray(claim) ? claim[0] : claim;
      if (roleStr?.toLowerCase() === 'supplier') {
        role = 'supplier';
      }
    } else if (roleClaim) {
      role = roleClaim.toLowerCase() === 'supplier' ? 'supplier' : 'buyer';
    }

    const u: User = {
      id: res.userId,
      full_name: `${res.firstName} ${res.lastName}`,
      email: res.email,
      role: role
    };

    this._user.set(u);
    localStorage.setItem('jomla_user', JSON.stringify(u));
    localStorage.setItem('jomla_token', res.token);
  }

  private clearAuthState() {
    this._user.set(null);
    localStorage.removeItem('jomla_user');
    localStorage.removeItem('jomla_token');
  }

  loginWithData(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, {
      email: data.email,
      password: data.password
    }, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  registerBuyer(data: { full_name: string; email: string; password: string }): Observable<AuthResponse> {
    const nameParts = data.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      firstName,
      lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.password,
      role: 'Buyer'
    }, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res, 'buyer'))
    );
  }

  registerSupplier(data: { full_name: string; email: string; password: string }): Observable<AuthResponse> {
    const nameParts = data.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      firstName,
      lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.password,
      role: 'Supplier'
    }, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res, 'supplier'))
    );
  }

  refreshAccessToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap({
        finalize: () => {
          this.clearAuthState();
        }
      })
    );
  }

  // Demo login helper fallbacks
  loginAsBuyer(full_name = 'Ahmed Mohamed', email = 'ahmed@example.com') {
    const u: User = { id: 'demo-buyer-id', full_name, email, role: 'buyer' };
    this._user.set(u);
    localStorage.setItem('jomla_user', JSON.stringify(u));
  }

  loginAsSupplier(full_name = 'TechHub Egypt', email = 'sales@techhub.eg') {
    const u: User = { id: 'demo-supplier-id', full_name, email, role: 'supplier' };
    this._user.set(u);
    localStorage.setItem('jomla_user', JSON.stringify(u));
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
}
