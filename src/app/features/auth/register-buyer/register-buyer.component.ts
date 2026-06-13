import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-register-buyer',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page" role="main">
      <div class="auth-card card">
        <div class="auth-logo">
          <div class="logo-icon-lg" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <h1 class="auth-heading">Join as a buyer</h1>
          <p class="auth-sub">Already have an account? <a routerLink="/login" class="link">Log in</a></p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="auth-form">
          <div class="form-group">
            <label class="form-label" for="full_name">Full Name</label>
            <input id="full_name" type="text" class="form-input" formControlName="full_name" autocomplete="name" placeholder="John Doe"
              [class.error]="submitted() && form.controls['full_name'].invalid">
            @if (submitted() && form.controls['full_name'].invalid) {
              <span class="form-error" role="alert">Full name must be at least 2 characters.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input id="email" type="email" class="form-input" formControlName="email" autocomplete="email" placeholder="you@company.com"
              [class.error]="submitted() && form.controls['email'].invalid">
            @if (submitted() && form.controls['email'].invalid) {
              <span class="form-error" role="alert">Please enter a valid email.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input id="password" type="password" class="form-input" formControlName="password" autocomplete="new-password" placeholder="••••••••"
              [class.error]="submitted() && form.controls['password'].invalid">
            @if (submitted() && form.controls['password'].invalid) {
              <span class="form-error" role="alert">Password must be at least 8 characters.</span>
            }
          </div>

          @if (errorMsg()) {
            <div class="error-banner" role="alert">{{ errorMsg() }}</div>
          }

          <button type="submit" class="btn btn-primary" style="width:100%;height:3rem;font-size:1rem" [disabled]="loading()">
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:calc(100vh - 64px); display:flex; align-items:center; justify-content:center; padding:2rem 1rem; background:#F9FAFB; }
    .auth-card { width:100%; max-width:480px; padding:2.5rem; }
    .auth-logo { display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:2rem; }
    .logo-icon-lg { background:var(--brand); color:#fff; padding:0.875rem; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:1.25rem; }
    .auth-heading { font-size:1.75rem; font-weight:800; margin-bottom:0.5rem; }
    .auth-sub { font-size:0.9375rem; color:var(--text-secondary); }
    .link { color:var(--brand); text-decoration:none; font-weight:500; }
    .link:hover { text-decoration:underline; }
    .auth-form { display:flex; flex-direction:column; gap:1.25rem; }
    .error-banner { background:rgba(239,68,68,0.08); color:var(--danger); border-radius:8px; padding:0.75rem 1rem; font-size:0.875rem; text-align:center; }
  `],
})
export class RegisterBuyerComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  protected form = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submitted = signal(false);
  protected loading = signal(false);
  protected errorMsg = signal('');

  protected submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    setTimeout(() => {
      const val = this.form.value as { full_name: string; email: string; password: string };
      this.auth.registerBuyer(val);
      this.loading.set(false);
      this.toast.success('Account created!', 'Welcome to Jomla.');
      this.router.navigate(['/discover']);
    }, 700);
  }
}
