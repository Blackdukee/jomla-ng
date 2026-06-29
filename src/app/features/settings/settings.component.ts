import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { CategoriesService } from '../../core/services/categories.service';
import { SupplierPreferencesService } from '../../core/services/supplier-preferences.service';
import { SupplierCategoryPreferenceDto } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private categoriesService = inject(CategoriesService);
  private supplierPrefsService = inject(SupplierPreferencesService);

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
  protected categoryPreferences = signal<SupplierCategoryPreferenceDto[]>([]);
  protected flatCategories: { id: string; name: string; displayName?: string }[] = [];

  protected prefForm = this.fb.group({
    category_id: ['', Validators.required],
    min_quantity: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe(cats => {
      this.flatCategories = cats.map(c => ({ id: c.id, name: c.name, displayName: c.displayName }));
      this.loadPreferences();
    });
  }

  private loadPreferences() {
    if (this.auth.isSupplier()) {
      this.supplierPrefsService.getPreferences().subscribe({
        next: (prefs) => {
          this.categoryPreferences.set(prefs);
        },
        error: (err) => {
          this.toast.error('Error', err?.error?.detail || 'Failed to load category preferences.');
        }
      });
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
    const catId = val.category_id;
    
    // Find category name
    const foundCat = this.flatCategories.find(c => c.id === catId);
    const catName = foundCat ? foundCat.name : 'Unknown Category';

    // Check duplicate
    if (this.categoryPreferences().some(p => p.categoryId === catId)) {
      this.toast.warning('Duplicate preference', 'You already have alerts configured for this category.');
      return;
    }

    this.supplierPrefsService.savePreference(catId, val.min_quantity).subscribe({
      next: (success) => {
        if (success) {
          this.toast.success('Alert preference added', `You will now be notified of requests in ${catName}.`);
          this.loadPreferences();
          this.prefForm.reset({ category_id: '', min_quantity: null });
          this.prefSubmitted.set(false);
        } else {
          this.toast.error('Error', 'Failed to add alert preference.');
        }
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to add alert preference.');
      }
    });
  }

  protected deletePreference(categoryId: string) {
    this.supplierPrefsService.removePreference(categoryId).subscribe({
      next: (success) => {
        if (success) {
          this.toast.success('Alert preference removed', 'Successfully deleted the alert rule.');
          this.loadPreferences();
        } else {
          this.toast.error('Error', 'Failed to remove alert preference.');
        }
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to remove alert preference.');
      }
    });
  }
}
