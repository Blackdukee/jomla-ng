import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MOCK_CATEGORIES } from '../../../core/mock-data';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-add-offer',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-offer.component.html',
  styleUrl: './add-offer.component.css'
})
export class AddOfferComponent {
  private fb = inject(FormBuilder);
  protected router = inject(Router);
  private toast = inject(ToastService);

  protected submitted = signal(false);
  protected loading = signal(false);
  protected images = signal<string[]>([]);
  protected isDragging = signal(false);
  protected categories = MOCK_CATEGORIES;

  private defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  protected form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category_id: ['', Validators.required],
    unit_price: [0, [Validators.required, Validators.min(0.01)]],
    discount_percent: [0, [Validators.required, Validators.min(1), Validators.max(99)]],
    hub_target_quantity: [0, [Validators.required, Validators.min(1)]],
    total_quantity_available: [0, [Validators.required, Validators.min(1)]],
    expiry_fallback_threshold: [null],
    expires_at: [this.defaultExpiry],
  });

  protected removeImage(i: number) { this.images.update(imgs => imgs.filter((_, idx) => idx !== i)); }

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
    Array.from(files).slice(0, maxAdd).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.images.update(imgs => [...imgs, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  protected submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.toast.success('Offer created!');
      this.router.navigate(['/supplier/offers']);
    }, 800);
  }
}
