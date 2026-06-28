import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { GroupRequestListItemDto } from '../../../core/models';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  private toast = inject(ToastService);
  private groupRequestsService = inject(GroupRequestsService);

  protected requests = signal<GroupRequestListItemDto[]>([]);
  protected modalOpen = signal(false);
  protected title = signal('');
  protected desc = signal('');
  protected qty = signal('');
  protected detecting = signal(false);
  protected detectedCat = signal<string | null>(null);

  protected selectedFiles = signal<File[]>([]);
  protected images = signal<string[]>([]);
  protected isDragging = signal(false);

  ngOnInit(): void {
    this.loadRequests();
  }

  protected loadRequests() {
    this.groupRequestsService.getGroupRequests({ status: 'Active', pageSize: 100 }).subscribe({
      next: (res) => {
        this.requests.set(res.items);
      },
      error: (err) => {
        this.toast.error('Error', 'Failed to load wishlist items.');
      }
    });
  }

  protected closeModal() {
    this.modalOpen.set(false);
    this.title.set('');
    this.desc.set('');
    this.qty.set('');
    this.detectedCat.set(null);
    this.selectedFiles.set([]);
    this.images.set([]);
  }

  protected detectCategory() {
    if (!this.desc() || this.detectedCat() || this.detecting()) return;
    this.detecting.set(true);
    setTimeout(() => {
      this.detecting.set(false);
      this.detectedCat.set('Electronics');
    }, 1200);
  }

  protected removeImage(i: number) {
    this.images.update(imgs => imgs.filter((_, idx) => idx !== i));
    this.selectedFiles.update(files => files.filter((_, idx) => idx !== i));
  }

  protected onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

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

  protected submitRequest() {
    const qtyNum = Number(this.qty());
    if (!this.title() || qtyNum <= 0) return;

    this.groupRequestsService.createGroupRequest({
      title: this.title(),
      quantity: qtyNum,
      description: this.desc() || null,
      images: this.selectedFiles().length > 0 ? this.selectedFiles() : null
    }).subscribe({
      next: () => {
        this.toast.success('Request posted!', 'Your group request is now live.');
        this.closeModal();
        this.loadRequests();
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to post request.');
      }
    });
  }

  protected onTitleChange(e: Event) {
    this.title.set((e.target as HTMLInputElement).value);
  }

  protected onDescChange(e: Event) {
    this.desc.set((e.target as HTMLTextAreaElement).value);
  }

  protected onQtyChange(e: Event) {
    this.qty.set((e.target as HTMLInputElement).value);
  }
}
