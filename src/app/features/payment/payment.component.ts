import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/toast.service';
import { fadeInUp } from '../../shared/animations/animations';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [ReactiveFormsModule],
  animations: [fadeInUp],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  private fb = inject(FormBuilder);
  protected router = inject(Router);
  private toast = inject(ToastService);

  protected loading = signal(false);
  protected successData = signal<{ order_number: string } | null>(null);

  protected form = this.fb.group({
    card: ['', Validators.required],
    expiry: ['', Validators.required],
    cvc: ['', Validators.required],
  });

  protected pay() {
    if (this.form.invalid) return;
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.successData.set({ order_number: 'JML-' + Math.random().toString(36).substring(2, 10).toUpperCase() });
    }, 1200);
  }
}
