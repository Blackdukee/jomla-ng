import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';

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

  protected accountForm = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit() {
    this.step1Submitted.set(true);
    if (this.accountForm.invalid) return;
    this.loading.set(true);
    setTimeout(() => {
      const val = this.accountForm.value as { full_name: string; email: string; password: string };
      this.auth.registerSupplier(val);
      this.loading.set(false);
      this.toast.success('Welcome to Jomla!', 'Your supplier account is ready.');
      this.router.navigate(['/supplier/requests']);
    }, 700);
  }
}
