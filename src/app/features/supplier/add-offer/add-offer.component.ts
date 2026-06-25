import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryDto } from '../../../core/models';
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
  private toast = inject(ToastService);
  private offersService = inject(OffersService);
  private categoriesService = inject(CategoriesService);

  protected submitted = signal(false);
  protected loading = signal(false);
  protected images = signal<string[]>([]);
  protected selectedFiles = signal<File[]>([]);
  protected isDragging = signal(false);
  protected categories = signal<CategoryDto[]>([]);

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
    });
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
    const val = this.form.value;

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

    this.offersService.createOffer(formData).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Offer created!');
        this.router.navigate(['/supplier/offers']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Failed to create offer', err?.error?.detail || err?.error?.title || 'An error occurred');
      }
    });
  }
}
