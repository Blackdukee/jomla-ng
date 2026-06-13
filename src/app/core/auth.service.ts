import { Injectable, signal, computed } from '@angular/core';
import { User } from './mock-data';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isBuyer = computed(() => this._user()?.role === 'buyer');
  readonly isSupplier = computed(() => this._user()?.role === 'supplier');

  constructor() {
    // Restore from localStorage
    const stored = localStorage.getItem('jomla_user');
    if (stored) {
      try { this._user.set(JSON.parse(stored)); } catch { }
    }
  }

  loginAsBuyer(full_name = 'Ahmed Mohamed', email = 'ahmed@example.com') {
    const u: User = { id: 1, full_name, email, role: 'buyer' };
    this._user.set(u);
    localStorage.setItem('jomla_user', JSON.stringify(u));
  }

  loginAsSupplier(full_name = 'TechHub Egypt', email = 'sales@techhub.eg') {
    const u: User = { id: 99, full_name, email, role: 'supplier' };
    this._user.set(u);
    localStorage.setItem('jomla_user', JSON.stringify(u));
  }

  logout() {
    this._user.set(null);
    localStorage.removeItem('jomla_user');
  }

  /** Called from login / register forms with form data */
  loginWithData(data: { email: string; password: string }) {
    // Mock: if email contains "supplier" use supplier role
    const isSupplier = data.email.toLowerCase().includes('supplier') ||
                       data.email.toLowerCase().includes('seller');
    if (isSupplier) {
      this.loginAsSupplier('Supplier User', data.email);
    } else {
      this.loginAsBuyer('Buyer User', data.email);
    }
  }

  registerBuyer(data: { full_name: string; email: string; password: string }) {
    this.loginAsBuyer(data.full_name, data.email);
  }

  registerSupplier(data: { full_name: string; email: string; password: string }) {
    this.loginAsSupplier(data.full_name, data.email);
  }
}
