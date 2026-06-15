import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { 
  MOCK_BUYER_HUBS, 
  MOCK_SUPPLIER_OFFERS, 
  MOCK_DEALS, 
  MOCK_ALERTS, 
  MOCK_WISHLIST, 
  Offer 
} from '../../core/mock-data';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  protected submitted = signal(false);
  protected loading = signal(false);

  protected form = this.fb.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  // Buyer Mock Data Counts
  protected activeHubsCount = signal(MOCK_BUYER_HUBS.active.length);
  protected completedOrdersCount = signal(MOCK_BUYER_HUBS.fulfilled.length);
  protected wishlistCount = signal(MOCK_WISHLIST.length);
  protected buyerHubs = signal([...MOCK_BUYER_HUBS.active, ...MOCK_BUYER_HUBS.fulfilled]);

  // Supplier Mock Data Counts
  protected supplierOffersCount = signal(MOCK_SUPPLIER_OFFERS.length);
  protected completedDealsCount = signal(MOCK_DEALS.length);
  protected alertsCount = signal(MOCK_ALERTS.length);
  protected supplierOffers = signal<Offer[]>(MOCK_SUPPLIER_OFFERS);

  constructor() {
    const user = this.auth.user();
    if (user) {
      this.form.patchValue({
        full_name: user.full_name,
        email: user.email,
      });
    }
  }

  protected initials() {
    const name = this.auth.user()?.full_name ?? '';
    return name.substring(0, 2).toUpperCase();
  }

  protected getProgressPercent(progress: number, target: number): number {
    return target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0;
  }

  protected save() {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.loading.set(true);
    setTimeout(() => {
      const val = this.form.value as { full_name: string; email: string };
      // Update local storage and auth service user state
      const currentUser = this.auth.user();
      if (currentUser) {
        const updated = { ...currentUser, ...val };
        // Trigger login method in auth service to refresh state
        if (currentUser.role === 'buyer') {
          this.auth.loginAsBuyer(val.full_name, val.email);
        } else {
          this.auth.loginAsSupplier(val.full_name, val.email);
        }
      }
      this.loading.set(false);
      this.toast.success('Profile updated!', 'Your personal information has been saved.');
    }, 500);
  }
}
