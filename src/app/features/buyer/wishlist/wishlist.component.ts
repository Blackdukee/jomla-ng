import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
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
export class WishlistComponent {
  private toast = inject(ToastService);
  private groupRequestsService = inject(GroupRequestsService);

  protected requests = signal<GroupRequestListItemDto[]>([]);
  protected modalOpen = signal(false);
  protected title = signal('');
  protected desc = signal('');
  protected qty = signal('');
  protected detecting = signal(false);
  protected detectedCat = signal<string | null>(null);

  protected closeModal() {
    this.modalOpen.set(false);
    this.title.set('');
    this.desc.set('');
    this.qty.set('');
    this.detectedCat.set(null);
  }

  protected detectCategory() {
    if (!this.desc() || this.detectedCat() || this.detecting()) return;
    this.detecting.set(true);
    setTimeout(() => {
      this.detecting.set(false);
      this.detectedCat.set('Electronics');
    }, 1200);
  }

  protected submitRequest() {
    const qtyNum = Number(this.qty());
    if (!this.title() || qtyNum <= 0) return;

    this.groupRequestsService.createGroupRequest({
      title: this.title(),
      quantity: qtyNum,
      description: this.desc() || null,
      imageUrls: null
    }).subscribe({
      next: () => {
        this.toast.success('Request posted!', 'Your group request is now live.');
        this.closeModal();
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
