// import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { AuthService } from '../../core/auth.service';
// import { ToastService } from '../../core/toast.service';
// import { OffersService } from '../../core/services/offers.service';
// import { CategoriesService } from '../../core/services/categories.service';
// import { SupplierPreferencesService } from '../../core/services/supplier-preferences.service';
// import { BatchesService } from '../../core/services/batches.service';
// import { User, MyOfferDto, CategoryDto, SupplierCategoryPreferenceDto, BuyerHubDto } from '../../core/models';
// import { UserService } from '../../core/services/user.service';

// import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// @Component({
//   selector: 'app-profile',
//   standalone: true,
//   imports: [ReactiveFormsModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   animations: [
//     trigger('profileEntrance', [
//       transition(':enter', [
//         query('.profile-header-banner, .main-content-layout', [
//           style({ opacity: 0, transform: 'translateY(16px)' }),
//           stagger('150ms', [
//             animate('2200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
//           ])
//         ], { optional: true })
//       ])
//     ])
//   ],
//   templateUrl: './profile.component.html',
//   styleUrl: './profile.component.css'
// })
// export class ProfileComponent implements OnInit {
//   protected auth = inject(AuthService);
//   private fb = inject(FormBuilder);
//   private toast = inject(ToastService);

//   protected submitted = signal(false);
//   protected loading = signal(false);

//   protected form = this.fb.group({
//     full_name: ['', Validators.required],
//     email: ['', [Validators.required, Validators.email]],
//   });

//   // Buyer Counts (Unsupported by backend - set to 0/empty)
//   protected activeHubsCount = signal(0);
//   protected completedOrdersCount = signal(0);
//   protected wishlistCount = signal(0);
//   protected buyerHubs = signal<BuyerHubDto[]>([]);

//   private offersService = inject(OffersService);
//   private batchesService = inject(BatchesService);
//   private categoriesService = inject(CategoriesService);
//   private supplierPrefsService = inject(SupplierPreferencesService);

//   // Supplier Data Counts
//   protected supplierOffersCount = signal(0);
//   protected completedDealsCount = signal(0);
//   protected alertsCount = signal(0);
//   protected supplierOffers = signal<MyOfferDto[]>([]);

//   // Supplier Preferences
//   protected preferences = signal<SupplierCategoryPreferenceDto[]>([]);
//   protected categories = signal<CategoryDto[]>([]);
//   protected prefSubmitted = signal(false);
//   protected prefForm = this.fb.group({
//     categoryId: ['', Validators.required],
//     minQuantity: [1, [Validators.required, Validators.min(1)]]
//   });

//   constructor() {
//     const user = this.auth.user();
//     if (user) {
//       this.form.patchValue({
//         full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
//         email: user.email,
//       });
//     }
//   }

//   ngOnInit(): void {
//     if (this.auth.isSupplier()) {
//       this.offersService.getMyOffers().subscribe({
//         next: (res) => {
//           const items = res.items || [];
//           this.supplierOffers.set(items);
//           this.supplierOffersCount.set(items.length);
//         }
//       });

//       this.loadPreferences();
//       this.categoriesService.getCategories().subscribe(cats => {
//         this.categories.set(cats);
//       });
//     }

//     if (this.auth.isBuyer()) {
//       this.batchesService.getMyHubs().subscribe({
//         next: (hubs) => {
//           this.buyerHubs.set(hubs);
//           this.activeHubsCount.set(hubs.filter(h => h.status.toLowerCase() !== 'completed' && h.status.toLowerCase() !== 'closed' && h.status.toLowerCase() !== 'failed').length);
//         },
//         error: (err) => console.error('Failed to load buyer hubs', err)
//       });
//     }
//   }

//   protected loadPreferences(): void {
//     this.supplierPrefsService.getPreferences().subscribe({
//       next: (prefs) => {
//         this.preferences.set(prefs);
//         this.alertsCount.set(prefs.length);
//       },
//       error: (err) => console.error('Failed to load preferences', err)
//     });
//   }

//   protected addPreference(): void {
//     this.prefSubmitted.set(true);
//     if (this.prefForm.invalid) return;

//     const val = this.prefForm.value as { categoryId: string; minQuantity: number };
//     this.supplierPrefsService.savePreference(val.categoryId, val.minQuantity).subscribe({
//       next: (success) => {
//         if (success) {
//           this.toast.success('Preference Saved', 'Alert threshold registered successfully.');
//           this.prefForm.reset({ categoryId: '', minQuantity: 1 });
//           this.prefSubmitted.set(false);
//           this.loadPreferences();
//         }
//       },
//       error: (err) => {
//         this.toast.error('Error', 'Failed to save preference. It might already exist.');
//       }
//     });
//   }

//   protected deletePreference(categoryId: string): void {
//     this.supplierPrefsService.removePreference(categoryId).subscribe({
//       next: (success) => {
//         if (success) {
//           this.toast.success('Preference Removed', 'Alert threshold deleted successfully.');
//           this.loadPreferences();
//         }
//       },
//       error: (err) => {
//         this.toast.error('Error', 'Failed to remove preference.');
//       }
//     });
//   }

//   protected initials() {
//     const name = this.auth.displayName;
//     return name.substring(0, 2).toUpperCase();
//   }

//   protected getProgressPercent(progress: number, target: number): number {
//     return target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0;
//   }

//   protected save() {
//     this.submitted.set(true);
//     if (this.form.invalid) return;

//     this.loading.set(true);
//     setTimeout(() => {
//       const val = this.form.value as { full_name: string; email: string };
//       const currentUser = this.auth.user();
//       if (currentUser) {
//         const nameParts = val.full_name.trim().split(' ');
//         const firstName = nameParts[0] || '';
//         const lastName = nameParts.slice(1).join(' ') || 'User';

//         const updated: User = {
//           ...currentUser,
//           firstName,
//           lastName,
//           email: val.email
//         };
//         this.auth.updateUser(updated);
//       }
//       this.loading.set(false);
//       this.toast.success('Profile updated!', 'Your personal information has been saved.');
//     }, 500);
//   }
// }

import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { OffersService } from '../../core/services/offers.service';
import { CategoriesService } from '../../core/services/categories.service';
import { SupplierPreferencesService } from '../../core/services/supplier-preferences.service';
import { BatchesService } from '../../core/services/batches.service';
import { User, MyOfferDto, CategoryDto, SupplierCategoryPreferenceDto, BuyerHubDto } from '../../core/models';
import { UserService } from '../../core/services/user.service';

import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('profileEntrance', [
      transition(':enter', [
        query('.profile-header-banner, .main-content-layout', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger('150ms', [
            animate('2200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private userService = inject(UserService); // ⬅️ جديد: لعمل نداءات الـ profile/password/image APIs

  protected submitted = signal(false);
  protected loading = signal(false);
  protected imageUploading = signal(false); // ⬅️ جديد: حالة تحميل رفع الصورة

 protected form = this.fb.group({
  first_name: ['', Validators.required],
  last_name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
});
  // Buyer Counts (Unsupported by backend - set to 0/empty)
  protected activeHubsCount = signal(0);
  protected completedOrdersCount = signal(0);
  protected wishlistCount = signal(0);
  protected buyerHubs = signal<BuyerHubDto[]>([]);

  private offersService = inject(OffersService);
  private batchesService = inject(BatchesService);
  private categoriesService = inject(CategoriesService);
  private supplierPrefsService = inject(SupplierPreferencesService);

  // Supplier Data Counts
  protected supplierOffersCount = signal(0);
  protected completedDealsCount = signal(0);
  protected alertsCount = signal(0);
  protected supplierOffers = signal<MyOfferDto[]>([]);

  // Supplier Preferences
  protected preferences = signal<SupplierCategoryPreferenceDto[]>([]);
  protected categories = signal<CategoryDto[]>([]);
  protected prefSubmitted = signal(false);
  protected prefForm = this.fb.group({
    categoryId: ['', Validators.required],
    minQuantity: [1, [Validators.required, Validators.min(1)]]
  });

constructor() {
  const user = this.auth.user();
  if (user) {
    this.form.patchValue({
      first_name: user.firstName || '',
      last_name: user.lastName || '',
      email: user.email,
    });
  }
}

  ngOnInit(): void {
    if (this.auth.isSupplier()) {
      this.offersService.getMyOffers().subscribe({
        next: (res) => {
          const items = res.items || [];
          this.supplierOffers.set(items);
          this.supplierOffersCount.set(items.length);
        }
      });

      this.loadPreferences();
      this.categoriesService.getCategories().subscribe(cats => {
        this.categories.set(cats);
      });
    }

    if (this.auth.isBuyer()) {
      this.batchesService.getMyHubs().subscribe({
        next: (hubs) => {
          this.buyerHubs.set(hubs);
          this.activeHubsCount.set(hubs.filter(h => h.status.toLowerCase() !== 'completed' && h.status.toLowerCase() !== 'closed' && h.status.toLowerCase() !== 'failed').length);
        },
        error: (err) => console.error('Failed to load buyer hubs', err)
      });
    }
  }

  protected loadPreferences(): void {
    this.supplierPrefsService.getPreferences().subscribe({
      next: (prefs) => {
        this.preferences.set(prefs);
        this.alertsCount.set(prefs.length);
      },
      error: (err) => console.error('Failed to load preferences', err)
    });
  }

  protected addPreference(): void {
    this.prefSubmitted.set(true);
    if (this.prefForm.invalid) return;

    const val = this.prefForm.value as { categoryId: string; minQuantity: number };
    this.supplierPrefsService.savePreference(val.categoryId, val.minQuantity).subscribe({
      next: (success) => {
        if (success) {
          this.toast.success('Preference Saved', 'Alert threshold registered successfully.');
          this.prefForm.reset({ categoryId: '', minQuantity: 1 });
          this.prefSubmitted.set(false);
          this.loadPreferences();
        }
      },
      error: (err) => {
        this.toast.error('Error', 'Failed to save preference. It might already exist.');
      }
    });
  }

  protected deletePreference(categoryId: string): void {
    this.supplierPrefsService.removePreference(categoryId).subscribe({
      next: (success) => {
        if (success) {
          this.toast.success('Preference Removed', 'Alert threshold deleted successfully.');
          this.loadPreferences();
        }
      },
      error: (err) => {
        this.toast.error('Error', 'Failed to remove preference.');
      }
    });
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
  const val = this.form.value as { first_name: string; last_name: string; email: string };

  this.userService.updateProfile({
    firstName: val.first_name,
    lastName: val.last_name,
    email: val.email
  }).subscribe({
    next: (res) => {
      const currentUser = this.auth.user();
      if (currentUser) {
        const updated: User = {
          ...currentUser,
          firstName: res.firstName,
          lastName: res.lastName,
          email: res.email,
          imageUrl: res.imageUrl ?? currentUser.imageUrl
        };
        this.auth.updateUser(updated);
      }
      this.loading.set(false);
      this.toast.success('Profile updated!', 'Your personal information has been saved.');
    },
    error: (err) => {
      this.loading.set(false);
      this.toast.error('Error', err?.error?.detail || 'Failed to update profile.');
    }
  });
}

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.imageUploading.set(true);
    this.userService.updateProfileImage(file).subscribe({
      next: (res) => {
        const currentUser = this.auth.user();
        if (currentUser) {
          this.auth.updateUser({ ...currentUser, imageUrl: res.imageUrl });
        }
        this.imageUploading.set(false);
        this.toast.success('Photo updated!', 'Your profile picture has been changed.');
        // Reset the input so selecting the same file again still fires the change event
        input.value = '';
      },
      error: (err) => {
        this.imageUploading.set(false);
        this.toast.error('Error', err?.error?.detail || 'Failed to upload image.');
        input.value = '';
      }
    });
  }
}