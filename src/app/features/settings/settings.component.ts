import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { MOCK_CATEGORIES, Category } from '../../core/mock-data';

interface CategoryPreference {
  id: string;
  category_id: number;
  category_name: string;
  min_quantity: number;
  is_active: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container" style="padding-top:2rem;padding-bottom:3rem" role="main">
      <!-- Page Header -->
      <div style="margin-bottom:2rem">
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.25rem">Settings</h1>
        <p style="color:var(--text-secondary)">Manage your account security, notification alerts, and business preferences.</p>
      </div>

      <!-- Segmented Control for tabs -->
      <div class="seg-control" role="tablist" aria-label="Settings Categories" style="margin-bottom:2rem">
        <button role="tab" [class.active]="activeTab() === 'security'" (click)="activeTab.set('security')">
          Security
        </button>
        <button role="tab" [class.active]="activeTab() === 'notifications'" (click)="activeTab.set('notifications')">
          Notifications
        </button>
        @if (auth.isSupplier()) {
          <button role="tab" [class.active]="activeTab() === 'preferences'" (click)="activeTab.set('preferences')">
            Category Alerts
          </button>
        }
      </div>

      <!-- SECURITY TAB -->
      @if (activeTab() === 'security') {
        <div class="card" style="padding:2rem;max-width:600px">
          <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1.5rem">Change Password</h2>
          
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate class="form-container">
            <div class="form-group">
              <label class="form-label" for="current_password">Current Password</label>
              <input
                id="current_password"
                type="password"
                class="form-input"
                [class.error]="pwSubmitted() && passwordForm.controls['current_password'].invalid"
                formControlName="current_password"
                placeholder="••••••••"
              >
              @if (pwSubmitted() && passwordForm.controls['current_password'].invalid) {
                <span class="form-error">Current password is required.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="new_password">New Password</label>
              <input
                id="new_password"
                type="password"
                class="form-input"
                [class.error]="pwSubmitted() && passwordForm.controls['new_password'].invalid"
                formControlName="new_password"
                placeholder="••••••••"
              >
              @if (pwSubmitted() && passwordForm.controls['new_password'].invalid) {
                <span class="form-error">Password must be at least 8 characters.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="confirm_password">Confirm New Password</label>
              <input
                id="confirm_password"
                type="password"
                class="form-input"
                [class.error]="pwSubmitted() && passwordForm.errors?.['mismatch']"
                formControlName="confirm_password"
                placeholder="••••••••"
              >
              @if (pwSubmitted() && passwordForm.errors?.['mismatch']) {
                <span class="form-error">Passwords do not match.</span>
              }
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:0.5rem;align-self:flex-start" [disabled]="pwLoading()">
              {{ pwLoading() ? 'Updating…' : 'Update Password' }}
            </button>
          </form>
        </div>
      }

      <!-- NOTIFICATIONS TAB -->
      @if (activeTab() === 'notifications') {
        <div class="card" style="padding:2rem;max-width:600px">
          <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">Notification Preferences</h2>
          <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1.5rem">Choose how you want to be alerted about hub activity and orders.</p>

          <div style="display:flex;flex-direction:column;gap:1.25rem">
            <div class="toggle-row">
              <div style="flex:1">
                <span style="font-weight:600;display:block">Email Notifications</span>
                <span style="font-size:0.8125rem;color:var(--text-secondary)">Receive weekly summaries and critical account alerts.</span>
              </div>
              <label class="switch">
                <input type="checkbox" checked>
                <span class="slider round"></span>
              </label>
            </div>

            <div class="toggle-row">
              <div style="flex:1">
                <span style="font-weight:600;display:block">Deal Completions</span>
                <span style="font-size:0.8125rem;color:var(--text-secondary)">Get notified instantly when a hub completes or a payment hold is captured.</span>
              </div>
              <label class="switch">
                <input type="checkbox" checked>
                <span class="slider round"></span>
              </label>
            </div>

            <div class="toggle-row">
              <div style="flex:1">
                <span style="font-weight:600;display:block">In-App SignalR Alerts</span>
                <span style="font-size:0.8125rem;color:var(--text-secondary)">Real-time notifications push via toast when new offers are placed.</span>
              </div>
              <label class="switch">
                <input type="checkbox" checked>
                <span class="slider round"></span>
              </label>
            </div>

            <button class="btn btn-primary" style="align-self:flex-start;margin-top:1rem" (click)="saveNotifications()">
              Save Notification Preferences
            </button>
          </div>
        </div>
      }

      <!-- PREFERENCES TAB (SUPPLIER ONLY) -->
      @if (activeTab() === 'preferences' && auth.isSupplier()) {
        <div class="preferences-container">
          <!-- Left: Add Preference -->
          <div class="card" style="padding:2rem;height:fit-content">
            <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">Add Category Alert</h2>
            <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1.5rem">
              Get notified immediately about buyer group requests matching these category rules.
            </p>

            <form [formGroup]="prefForm" (ngSubmit)="addPreference()" novalidate class="form-container">
              <div class="form-group">
                <label class="form-label" for="category_id">Product Category</label>
                <select id="category_id" class="form-input" formControlName="category_id" style="border-radius:12px">
                  <option value="" disabled selected>Select a category</option>
                  @for (cat of flatCategories; track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
                @if (prefSubmitted() && prefForm.controls['category_id'].invalid) {
                  <span class="form-error">Category is required.</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="min_quantity">
                  Min Quantity Threshold
                </label>
                <input
                  id="min_quantity"
                  type="number"
                  class="form-input"
                  formControlName="min_quantity"
                  placeholder="e.g. 50"
                  min="1"
                >
                <span class="form-hint">You will only receive alerts when buyer request quantity reaches this amount.</span>
                @if (prefSubmitted() && prefForm.controls['min_quantity'].invalid) {
                  <span class="form-error">Please enter a valid positive quantity.</span>
                }
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem">
                Add Preference
              </button>
            </form>
          </div>

          <!-- Right: Category Alert List -->
          <div class="card" style="padding:2rem">
            <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem">Preferred Categories Alert List</h2>
            
            @if (categoryPreferences().length === 0) {
              <div class="empty-state">
                No alert preferences set. You won't receive automated demand signals from buyers.
              </div>
            } @else {
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Min Demand Quantity</th>
                      <th>Status</th>
                      <th style="text-align:right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (pref of categoryPreferences(); track pref.id) {
                      <tr>
                        <td style="font-weight:600">{{ pref.category_name }}</td>
                        <td>{{ pref.min_quantity }} units</td>
                        <td>
                          <button 
                            class="badge-btn"
                            [class.badge-success]="pref.is_active"
                            [class.badge-muted]="!pref.is_active"
                            (click)="togglePreference(pref)"
                            [title]="pref.is_active ? 'Click to deactivate' : 'Click to activate'"
                          >
                            {{ pref.is_active ? 'Active' : 'Inactive' }}
                          </button>
                        </td>
                        <td style="text-align:right">
                          <button class="btn-icon btn btn-ghost btn-sm" (click)="deletePreference(pref.id)" aria-label="Delete preference">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger)">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--bg-surface);
    }
    .preferences-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    @media (min-width: 1024px) {
      .preferences-container {
        grid-template-columns: 320px 1fr;
      }
    }
    /* Toggle Switch styles */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }
    .switch input { 
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: var(--text-muted);
      transition: .4s;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
    }
    input:checked + .slider {
      background-color: var(--brand);
    }
    input:focus + .slider {
      box-shadow: 0 0 1px var(--brand);
    }
    input:checked + .slider:before {
      transform: translateX(20px);
    }
    .slider.round {
      border-radius: 34px;
    }
    .slider.round:before {
      border-radius: 50%;
    }
    .badge-btn {
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
    }
    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--text-secondary);
      background: #F9FAFB;
      border: 1px dashed var(--border);
      border-radius: 12px;
    }
    .table-responsive {
      overflow-x: auto;
    }
  `],
})
export class SettingsComponent {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  protected activeTab = signal<'security' | 'notifications' | 'preferences'>('security');
  
  // Password Form
  protected pwSubmitted = signal(false);
  protected pwLoading = signal(false);
  
  protected passwordForm = this.fb.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', Validators.required],
  }, {
    validators: (group) => {
      const newPw = group.get('new_password')?.value;
      const confPw = group.get('confirm_password')?.value;
      return newPw === confPw ? null : { mismatch: true };
    }
  });

  // Supplier Preferences
  protected prefSubmitted = signal(false);
  protected categoryPreferences = signal<CategoryPreference[]>([]);
  protected flatCategories: { id: number; name: string }[] = [];

  protected prefForm = this.fb.group({
    category_id: ['', Validators.required],
    min_quantity: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.flattenCategories();
    this.loadPreferences();
  }

  private flattenCategories() {
    // Populate simple flat list for select option dropdown from hierarchical categories
    MOCK_CATEGORIES.forEach(cat => {
      this.flatCategories.push({ id: cat.id, name: cat.name });
      if (cat.children) {
        cat.children.forEach(sub => {
          this.flatCategories.push({ id: sub.id, name: `${cat.name} / ${sub.name}` });
        });
      }
    });
  }

  private loadPreferences() {
    const stored = localStorage.getItem('jomla_seller_prefs');
    if (stored) {
      try {
        this.categoryPreferences.set(JSON.parse(stored));
        return;
      } catch {}
    }
    
    // Seed initial mock supplier preferences if empty
    if (this.auth.isSupplier()) {
      const initialPrefs: CategoryPreference[] = [
        {
          id: 'pref-1',
          category_id: 11,
          category_name: 'Electronics / Audio',
          min_quantity: 50,
          is_active: true
        },
        {
          id: 'pref-2',
          category_id: 31,
          category_name: 'Solar & Energy / Solar Panels',
          min_quantity: 100,
          is_active: true
        }
      ];
      this.categoryPreferences.set(initialPrefs);
      localStorage.setItem('jomla_seller_prefs', JSON.stringify(initialPrefs));
    }
  }

  protected changePassword() {
    this.pwSubmitted.set(true);
    if (this.passwordForm.invalid) return;

    this.pwLoading.set(true);
    setTimeout(() => {
      this.pwLoading.set(false);
      this.passwordForm.reset();
      this.pwSubmitted.set(false);
      this.toast.success('Password updated!', 'Your security password has been changed.');
    }, 800);
  }

  protected saveNotifications() {
    this.toast.success('Preferences saved', 'Notification channels configured.');
  }

  protected addPreference() {
    this.prefSubmitted.set(true);
    if (this.prefForm.invalid) return;

    const val = this.prefForm.value as { category_id: string; min_quantity: number };
    const catId = Number(val.category_id);
    
    // Find category name
    const foundCat = this.flatCategories.find(c => c.id === catId);
    const catName = foundCat ? foundCat.name : 'Unknown Category';

    // Check duplicate
    if (this.categoryPreferences().some(p => p.category_id === catId)) {
      this.toast.warning('Duplicate preference', 'You already have alerts configured for this category.');
      return;
    }

    const newPref: CategoryPreference = {
      id: `pref-${Date.now()}`,
      category_id: catId,
      category_name: catName,
      min_quantity: val.min_quantity,
      is_active: true
    };

    const updated = [...this.categoryPreferences(), newPref];
    this.categoryPreferences.set(updated);
    localStorage.setItem('jomla_seller_prefs', JSON.stringify(updated));

    this.prefForm.reset({ category_id: '', min_quantity: null });
    this.prefSubmitted.set(false);
    this.toast.success('Alert preference added', `You will now be notified of requests in ${catName}.`);
  }

  protected togglePreference(pref: CategoryPreference) {
    const updated = this.categoryPreferences().map(p => {
      if (p.id === pref.id) {
        return { ...p, is_active: !p.is_active };
      }
      return p;
    });
    this.categoryPreferences.set(updated);
    localStorage.setItem('jomla_seller_prefs', JSON.stringify(updated));
    this.toast.success('Alert status toggled', `Preference status updated.`);
  }

  protected deletePreference(id: string) {
    const updated = this.categoryPreferences().filter(p => p.id !== id);
    this.categoryPreferences.set(updated);
    localStorage.setItem('jomla_seller_prefs', JSON.stringify(updated));
    this.toast.success('Alert preference removed', 'Successfully deleted the alert rule.');
  }
}
