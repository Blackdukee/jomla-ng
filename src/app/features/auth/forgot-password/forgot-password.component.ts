import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('entrance', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('800ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  protected step = signal<1 | 2>(1);
  protected loading = signal(false);
  protected submitted = signal(false);
  protected errorMsg = signal('');

  // Step 1 Form: Email
  protected emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Step 2 Form: Code & New Passwords
  protected resetForm = this.fb.group({
    token: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: (group) => {
      const pass = group.get('newPassword')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return pass === confirm ? null : { passwordMismatch: true };
    }
  });

  protected sendCode() {
    this.submitted.set(true);
    if (this.emailForm.invalid) return;

    this.loading.set(true);
    this.errorMsg.set('');

    const email = this.emailForm.value.email!;
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(false);
        this.toast.success('Code Sent', 'If the email exists, a password reset code has been sent.');
        this.step.set(2);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.detail || 'Failed to send reset code.');
        this.toast.error('Request failed', this.errorMsg());
      }
    });
  }

  protected resetPassword() {
    this.submitted.set(true);
    if (this.resetForm.invalid) return;

    this.loading.set(true);
    this.errorMsg.set('');

    const val = this.resetForm.value;
    const payload = {
      email: this.emailForm.value.email!,
      token: val.token!,
      newPassword: val.newPassword!,
      confirmPassword: val.confirmPassword!
    };

    this.auth.resetPassword(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Success!', 'Your password has been reset successfully. Please log in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.detail || 'Failed to reset password. Please check your code.');
        this.toast.error('Reset failed', this.errorMsg());
      }
    });
  }
}
