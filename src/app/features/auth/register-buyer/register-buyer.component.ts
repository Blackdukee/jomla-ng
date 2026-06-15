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
  templateUrl: './register-buyer.component.html',
  styleUrl: './register-buyer.component.css'
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
