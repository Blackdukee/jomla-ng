import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { OffersService } from '../../core/services/offers.service';
import { User, MyOfferDto } from '../../core/models';
import { 
  MOCK_BUYER_HUBS, 
  MOCK_DEALS, 
  MOCK_ALERTS, 
  MOCK_WISHLIST
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

  private offersService = inject(OffersService);

  // Supplier Data Counts
  protected supplierOffersCount = signal(0);
  protected completedDealsCount = signal(MOCK_DEALS.length);
  protected alertsCount = signal(MOCK_ALERTS.length);
  protected supplierOffers = signal<MyOfferDto[]>([]);

  constructor() {
    const user = this.auth.user();
    if (user) {
      this.form.patchValue({
        full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
      });
    }
  }

  ngOnInit(): void {
    if (this.auth.isSupplier()) {
      this.offersService.getMyOffers().subscribe({
        next: (offs) => {
          this.supplierOffers.set(offs);
          this.supplierOffersCount.set(offs.length);
        }
      });
    }
  }

  protected initials() {
    const name = this.auth.displayName;
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
      const currentUser = this.auth.user();
      if (currentUser) {
        const nameParts = val.full_name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        const updated: User = {
          ...currentUser,
          firstName,
          lastName,
          email: val.email
        };
        this.auth.updateUser(updated);
      }
      this.loading.set(false);
      this.toast.success('Profile updated!', 'Your personal information has been saved.');
    }, 500);
  }
}
