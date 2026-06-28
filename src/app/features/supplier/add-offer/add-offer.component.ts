import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryDto, OfferDto } from '../../../core/models';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-add-offer',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-offer.component.html',
  styleUrl: './add-offer.component.css'
})
export class AddOfferComponent implements OnInit {
  private fb = inject(FormBuilder);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private offersService = inject(OffersService);
  private categoriesService = inject(CategoriesService);

  protected submitted = signal(false);
  protected loading = signal(false);
  protected images = signal<string[]>([]);
  protected selectedFiles = signal<File[]>([]);
  protected isDragging = signal(false);
  protected categories = signal<CategoryDto[]>([]);

  protected offerId = signal<string | null>(null);
  protected isEditMode = computed(() => this.offerId() !== null);
  private loadedOffer = signal<OfferDto | null>(null);
  protected hasOpenBatch = computed(() => {
    const off = this.loadedOffer();
    return off ? (!!off.activeBatchId || (off.batches?.some(b => b.status === 'Open') ?? false)) : false;
  });

  private defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  protected form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.minLength(10)]],
    category_id: ['', Validators.required],
    unit_price: [0, [Validators.required, Validators.min(0.01)]],
    discount_percent: [0, [Validators.required, Validators.min(1), Validators.max(99)]],
    hub_target_quantity: [0, [Validators.required, Validators.min(1)]],
    total_quantity_available: [0, [Validators.required, Validators.min(1)]],
    expiry_fallback_threshold: [null],
    expires_at: [this.defaultExpiry],
  });

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe(cats => {
      this.categories.set(cats);
      // If we have an offer already loaded, patch its category_id now
      const off = this.loadedOffer();
      if (off) {
        const cat = cats.find(c => c.name === off.categoryName);
        if (cat) {
          this.form.patchValue({ category_id: cat.id });
        }
      }
    });

    const id = this.route.snapshot.paramMap.get('offerId');
    if (id) {
      this.offerId.set(id);
      this.loading.set(true);
      this.offersService.getOfferById(id).subscribe({
        next: (off) => {
          this.loadedOffer.set(off);
          this.form.patchValue({
            title: off.title,
            description: off.description || '',
            category_id: this.categories().find(c => c.name === off.categoryName)?.id || '',
            unit_price: off.unitPrice,
            discount_percent: off.discountPercentage,
            hub_target_quantity: off.hubTargetQuantity,
            total_quantity_available: (off as any).totalQuantityAvailable || off.hubTargetQuantity,
            expiry_fallback_threshold: (off as any).minFallbackQuantity || null,
            expires_at: off.expiresAt ? new Date(off.expiresAt).toISOString().slice(0, 16) : this.defaultExpiry
          });
          
          // Programmatically disable locked controls if batch is open
          const hasBatch = !!off.activeBatchId || (off.batches?.some(b => b.status === 'Open') ?? false);
          if (hasBatch) {
            this.form.controls['title'].disable();
            this.form.controls['description'].disable();
            this.form.controls['category_id'].disable();
            this.form.controls['unit_price'].disable();
            this.form.controls['discount_percent'].disable();
            this.form.controls['hub_target_quantity'].disable();
          }

          if (off.images && off.images.length > 0) {
            this.images.set(off.images);
          }
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error', 'Failed to load offer details.');
          this.router.navigate(['/supplier/offers']);
          this.loading.set(false);
        }
      });
    }
  }

  protected removeImage(i: number) {
    this.images.update(imgs => imgs.filter((_, idx) => idx !== i));
    this.selectedFiles.update(files => files.filter((_, idx) => idx !== i));
  }

  protected onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging.set(true); }

  protected onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    if (e.dataTransfer?.files) this.processFiles(e.dataTransfer.files);
  }

  protected onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) this.processFiles(input.files);
  }

  private processFiles(files: FileList) {
    const maxAdd = 8 - this.images().length;
    const addedFiles = Array.from(files).slice(0, maxAdd);
    addedFiles.forEach(file => {
      this.selectedFiles.update(current => [...current, file]);
      const reader = new FileReader();
      reader.onload = () => this.images.update(imgs => [...imgs, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  protected submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);

    const formData = new FormData();
    const val = this.form.getRawValue();

    formData.append('title', val.title || '');
    formData.append('description', val.description || '');
    formData.append('categoryId', val.category_id || '');
    formData.append('unitPrice', (val.unit_price || 0).toString());
    formData.append('discountPercentage', (val.discount_percent || 0).toString());
    formData.append('batchTargetQuantity', (val.hub_target_quantity || 0).toString());
    formData.append('totalQuantityAvailable', (val.total_quantity_available || 0).toString());

    if (val.expiry_fallback_threshold !== null && val.expiry_fallback_threshold !== undefined) {
      formData.append('minFallbackQuantity', String(val.expiry_fallback_threshold));
    }
    if (val.expires_at) {
      formData.append('expiresAt', new Date(val.expires_at).toISOString());
    }

    this.selectedFiles().forEach(file => {
      formData.append('images', file, file.name);
    });

    if (this.isEditMode()) {
      const id = this.offerId()!;
      formData.append('id', id);
      this.offersService.updateOffer(id, formData).subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Offer updated successfully!');
          this.router.navigate(['/supplier/offers', id]);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error('Failed to update offer', err?.error?.detail || err?.error?.title || 'An error occurred');
        }
      });
    } else {
      this.offersService.createOffer(formData).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success('Offer created!');
          if (res && res.offerId) {
            this.router.navigate(['/supplier/offers', res.offerId], { queryParams: { created: 'true' } });
          } else {
            this.router.navigate(['/supplier/offers']);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error('Failed to create offer', err?.error?.detail || err?.error?.title || 'An error occurred');
        }
      });
    }
  }
}
