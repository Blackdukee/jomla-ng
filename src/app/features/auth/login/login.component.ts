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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
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

    const val = this.form.value as { email: string; password: string };
    this.auth.loginWithData(val).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Welcome back!', 'You have been signed in.');
        if (this.auth.isBuyer()) {
          this.router.navigate(['/discover']);
        } else {
          this.router.navigate(['/supplier/requests']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.detail || err?.error?.title || 'Invalid credentials');
        this.toast.error('Sign in failed', this.errorMsg());
      }
    });
  }
}
