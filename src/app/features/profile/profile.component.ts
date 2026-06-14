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
  template: `
    <div class="container" style="padding-top:2rem;padding-bottom:3rem" role="main">
      <!-- Page Header -->
      <div style="margin-bottom:2rem">
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.25rem">My Profile</h1>
        <p style="color:var(--text-secondary)">Manage your personal details and view your account dashboard.</p>
      </div>

      <div class="profile-grid">
        <!-- Left Column: Edit Details -->
        <div class="card" style="padding:2rem;height:fit-content">
          <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:1.5rem;text-align:center">
            <div class="profile-avatar">
              {{ initials() }}
            </div>
            <h2 style="font-size:1.25rem;font-weight:700;margin-top:0.75rem">{{ auth.user()?.full_name }}</h2>
            <span class="badge" [class.badge-brand]="auth.isSupplier()" [class.badge-brand-light]="auth.isBuyer()" style="margin-top:0.5rem;text-transform:capitalize">
              {{ auth.user()?.role }}
            </span>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" novalidate class="form-container">
            <div class="form-group">
              <label class="form-label" for="full_name">Full Name</label>
              <input
                id="full_name"
                type="text"
                class="form-input"
                [class.error]="submitted() && form.controls['full_name'].invalid"
                formControlName="full_name"
                placeholder="Ahmed Mohamed"
              >
              @if (submitted() && form.controls['full_name'].invalid) {
                <span class="form-error">Full name is required.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="email">Email Address</label>
              <input
                id="email"
                type="email"
                class="form-input"
                [class.error]="submitted() && form.controls['email'].invalid"
                formControlName="email"
                placeholder="email@example.com"
              >
              @if (submitted() && form.controls['email'].invalid) {
                <span class="form-error">Please enter a valid email address.</span>
              }
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem" [disabled]="loading()">
              {{ loading() ? 'Saving changes…' : 'Save Profile' }}
            </button>
          </form>
        </div>

        <!-- Right Column: Role-Specific Summary & Activity -->
        <div style="display:flex;flex-direction:column;gap:1.5rem">
          <!-- Stats Cards -->
          <div class="stats-row">
            @if (auth.isBuyer()) {
              <div class="card stat-card">
                <span class="stat-num">{{ activeHubsCount() }}</span>
                <span class="stat-lbl">Active Hubs</span>
              </div>
              <div class="card stat-card">
                <span class="stat-num">{{ completedOrdersCount() }}</span>
                <span class="stat-lbl">Completed Deals</span>
              </div>
              <div class="card stat-card">
                <span class="stat-num">{{ wishlistCount() }}</span>
                <span class="stat-lbl">Wishlist Items</span>
              </div>
            } @else if (auth.isSupplier()) {
              <div class="card stat-card">
                <span class="stat-num">{{ supplierOffersCount() }}</span>
                <span class="stat-lbl">My Offers</span>
              </div>
              <div class="card stat-card">
                <span class="stat-num">{{ completedDealsCount() }}</span>
                <span class="stat-lbl">Deals Sealed</span>
              </div>
              <div class="card stat-card">
                <span class="stat-num">{{ alertsCount() }}</span>
                <span class="stat-lbl">Demand Alerts</span>
              </div>
            }
          </div>

          <!-- Activity List Card -->
          <div class="card" style="padding:1.5rem">
            <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem">
              {{ auth.isBuyer() ? 'My Joined Hubs' : 'My Recent Offers' }}
            </h2>

            @if (auth.isBuyer()) {
              @if (buyerHubs().length === 0) {
                <p style="color:var(--text-secondary);text-align:center;padding:2rem 0">You haven't joined any hubs yet.</p>
              } @else {
                <div style="display:flex;flex-direction:column;gap:1rem">
                  @for (hub of buyerHubs(); track hub.id) {
                    <div class="activity-row">
                      <div style="flex:1">
                        <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem">
                          <span style="font-weight:600;font-size:0.9375rem">{{ hub.title }}</span>
                          <span class="badge badge-brand-light" style="font-size:0.7rem;text-transform:uppercase">{{ hub.status }}</span>
                        </div>
                        <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:0.5rem">
                          Committed: <strong style="color:var(--text-primary)">{{ hub.committed_units }} units</strong>
                        </p>
                        @if (hub.fill_target && hub.fill_progress !== undefined) {
                          <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.25rem">
                            <span>Hub Progress: {{ hub.fill_progress }} / {{ hub.fill_target }}</span>
                            <span>{{ getProgressPercent(hub.fill_progress, hub.fill_target) }}%</span>
                          </div>
                          <div class="progress-track" style="height:6px">
                            <div class="progress-fill" [style.width.%]="getProgressPercent(hub.fill_progress, hub.fill_target)"></div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            } @else if (auth.isSupplier()) {
              @if (supplierOffers().length === 0) {
                <p style="color:var(--text-secondary);text-align:center;padding:2rem 0">You haven't created any offers yet.</p>
              } @else {
                <div style="display:flex;flex-direction:column;gap:1rem">
                  @for (offer of supplierOffers(); track offer.id) {
                    <div class="activity-row">
                      <div style="flex:1">
                        <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem">
                          <span style="font-weight:600;font-size:0.9375rem">{{ offer.title }}</span>
                          <span class="badge badge-success" style="font-size:0.7rem;text-transform:uppercase">Active</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:0.8125rem;color:var(--text-secondary);margin-top:0.25rem">
                          <span>Price: <strong>EGP {{ offer.discounted_price }}</strong> (Orig: EGP {{ offer.unit_price }})</span>
                          <span>Committed: <strong>{{ offer.committed_units }} / {{ offer.hub_target_quantity }} units</strong></span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    @media (min-width: 1024px) {
      .profile-grid {
        grid-template-columns: 320px 1fr;
      }
    }
    .profile-avatar {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      background: var(--brand-light);
      color: var(--brand);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 800;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .stat-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background: var(--bg-surface);
    }
    .stat-num {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--brand);
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    .stat-lbl {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .activity-row {
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  `],
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
