import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_WISHLIST, GroupRequest } from '../../../core/mock-data';
import { ToastService } from '../../../core/toast.service';
import { inject } from '@angular/core';

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

  protected requests = signal<GroupRequest[]>([...MOCK_WISHLIST]);
  protected modalOpen = signal(false);
  protected desc = signal('');
  protected qty = signal('');
  protected detecting = signal(false);
  protected detectedCat = signal<string | null>(null);

  protected closeModal() {
    this.modalOpen.set(false);
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
    const newReq: GroupRequest = {
      id: Date.now(),
      description: this.desc(),
      quantity: Number(this.qty()),
      buyer_count: 1,
      status: 'active',
      created_at: new Date().toISOString(),
      creator_name: 'You',
      category_name: this.detectedCat() ?? undefined,
      participants: [],
      current_user_joined: true,
    };
    this.requests.update(r => [newReq, ...r]);
    this.toast.success('Request posted!', 'Your group request is now live.');
    this.closeModal();
  }

  protected onDescChange(e: Event) {
    this.desc.set((e.target as HTMLTextAreaElement).value);
  }

  protected onQtyChange(e: Event) {
    this.qty.set((e.target as HTMLInputElement).value);
  }
}
