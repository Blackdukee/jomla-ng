import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page" role="main">
      <div class="auth-card card">
        <!-- Logo -->
        <div class="auth-logo">
          <div class="logo-icon-lg" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <h1 class="auth-heading">Welcome back</h1>
          <p class="auth-sub">
            Don't have an account?
            <a routerLink="/register/buyer" class="link">Register as buyer</a>
            or
            <a routerLink="/register/supplier" class="link">supplier</a>
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="auth-form">
          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input
              id="email"
              type="email"
              class="form-input"
              [class.error]="submitted() && form.controls['email'].invalid"
              formControlName="email"
              autocomplete="email"
              placeholder="you@company.com"
              [attr.aria-invalid]="submitted() && form.controls['email'].invalid"
              aria-describedby="email-error"
            >
            @if (submitted() && form.controls['email'].invalid) {
              <span id="email-error" class="form-error" role="alert">Please enter a valid email.</span>
            }
          </div>

          <!-- Password -->
          <div class="form-group">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <label class="form-label" for="password">Password</label>
              <a href="#" class="link" style="font-size:0.8125rem">Forgot password?</a>
            </div>
            <input
              id="password"
              type="password"
              class="form-input"
              [class.error]="submitted() && form.controls['password'].invalid"
              formControlName="password"
              autocomplete="current-password"
              placeholder="••••••••"
              [attr.aria-invalid]="submitted() && form.controls['password'].invalid"
              aria-describedby="password-error"
            >
            @if (submitted() && form.controls['password'].invalid) {
              <span id="password-error" class="form-error" role="alert">Password is required.</span>
            }
          </div>

          @if (errorMsg()) {
            <div class="error-banner" role="alert">{{ errorMsg() }}</div>
          }

          <button type="submit" class="btn btn-primary" style="width:100%;height:3rem;font-size:1rem" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Log in' }}
          </button>
        </form>

        <!-- Demo shortcuts -->
        <div class="demo-shortcuts">
          <p style="font-size:0.8rem;color:var(--text-muted);text-align:center;margin-bottom:0.75rem">Quick demo login:</p>
          <div style="display:flex;gap:0.75rem">
            <button type="button" class="btn btn-outline btn-sm" style="flex:1" (click)="demoLogin('buyer')">Buyer Demo</button>
            <button type="button" class="btn btn-outline btn-sm" style="flex:1" (click)="demoLogin('supplier')">Supplier Demo</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: #F9FAFB;
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
      padding: 2.5rem;
    }
    .auth-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo-icon-lg {
      background: var(--brand);
      color: #fff;
      padding: 0.875rem;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    .auth-heading { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
    .auth-sub { font-size: 0.9375rem; color: var(--text-secondary); }
    .link { color: var(--brand); text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .error-banner {
      background: rgba(239,68,68,0.08);
      color: var(--danger);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      text-align: center;
    }
    .demo-shortcuts {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submitted = signal(false);
  protected loading = signal(false);
  protected errorMsg = signal('');

  protected submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    // Simulate async
    setTimeout(() => {
      const val = this.form.value as { email: string; password: string };
      this.auth.loginWithData(val);
      this.loading.set(false);
      this.toast.success('Welcome back!', 'You have been signed in.');
      if (this.auth.isBuyer()) this.router.navigate(['/discover']);
      else this.router.navigate(['/supplier/requests']);
    }, 600);
  }

  protected demoLogin(role: 'buyer' | 'supplier') {
    if (role === 'buyer') this.auth.loginAsBuyer();
    else this.auth.loginAsSupplier();
    this.toast.success('Demo login', `Signed in as demo ${role}.`);
    if (role === 'buyer') this.router.navigate(['/discover']);
    else this.router.navigate(['/supplier/requests']);
  }
}
