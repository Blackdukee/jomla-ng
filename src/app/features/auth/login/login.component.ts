import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { environment } from '../../../../environments/environment';

type DemoRole = 'buyer' | 'seller' | 'admin';
type LoginSource = 'form' | DemoRole;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  protected readonly enableDemoAccounts = environment.enableDemoAccounts;

  private readonly demoAccounts: Record<DemoRole, { email: string; password: string }> = {
    buyer: { email: 'buyer1@jomla.test', password: 'Password123!' },
    seller: { email: 'seller1@jomla.test', password: 'Password123!' },
    admin: { email: 'admin@jomla.test', password: 'Admin123!' },
  };

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submitted = signal(false);
  protected loading = signal(false);
  protected activeSubmit = signal<LoginSource | null>(null);
  protected errorMsg = signal('');
  protected showPassword = signal(false);

  protected submit() {
    this.submitted.set(true);
    if (this.loading() || this.form.invalid) return;
    this.performLogin('form');
  }

  protected loginAsDemo(role: DemoRole) {
    if (!this.enableDemoAccounts || this.loading()) return;
    this.submitted.set(false);
    this.errorMsg.set('');
    this.form.setValue(this.demoAccounts[role]);
    this.performLogin(role);
  }

  private performLogin(source: LoginSource) {
    this.loading.set(true);
    this.activeSubmit.set(source);
    this.errorMsg.set('');

    const { email, password } = this.form.getRawValue();
    this.auth.loginWithData({
      email: (email ?? '').trim(),
      password: password ?? '',
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.activeSubmit.set(null);
        this.toast.success('Welcome back!', 'You have been signed in.');
        if (this.auth.isAdmin()) {
          this.router.navigate(['/admin']);
        } else if (this.auth.isBuyer()) {
          this.router.navigate(['/discover']);
        } else {
          this.router.navigate(['/supplier/requests']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.activeSubmit.set(null);
        this.errorMsg.set(err?.error?.detail || err?.error?.title || 'Invalid credentials');
        this.toast.error('Sign in failed', this.errorMsg());
      }
    });
  }
}
