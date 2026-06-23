import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { RegisterRequest } from '../../../core/models';

@Component({
  selector: 'app-register-supplier',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-supplier.component.html',
  styleUrl: './register-supplier.component.css'
})
export class RegisterSupplierComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  protected step1Submitted = signal(false);
  protected loading = signal(false);
  protected errorMsg = signal('');

  protected accountForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, {
    validators: (group) => {
      const pw = group.get('password')?.value;
      const conf = group.get('confirmPassword')?.value;
      return pw === conf ? null : { mismatch: true };
    }
  });

  protected submit() {
    this.step1Submitted.set(true);
    if (this.accountForm.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const val = this.accountForm.value as RegisterRequest;
    this.auth.registerSupplier(val).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Welcome to Jomla!', 'Your supplier account is ready.');
        this.router.navigate(['/supplier/requests']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.detail || err?.error?.title || 'Registration failed');
        this.toast.error('Registration failed', this.errorMsg());
      }
    });
  }
}
