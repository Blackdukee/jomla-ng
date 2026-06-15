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
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
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
