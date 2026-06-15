import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_REQUESTS, MOCK_OFFER_RESPONSES, GroupRequest, OfferResponse } from '../../../core/mock-data';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-manage-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-request.component.html',
  styleUrl: './manage-request.component.css'
})
export class ManageRequestComponent {
  protected router = inject(Router);
  private toast = inject(ToastService);

  protected request = signal<GroupRequest>({ ...MOCK_REQUESTS[0] });
  protected myOffer = signal<OfferResponse | null>(null);

  protected qty = signal('');
  protected price = signal('');
  protected minPrice = signal('');
  protected loading = signal(false);

  protected submitOffer() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.myOffer.set({
        id: 999,
        request_id: this.request().id,
        supplier_id: 99,
        supplier_name: 'My Company',
        unit_price: Number(this.price()),
        current_unit_price: Number(this.price()),
        min_unit_price: Number(this.minPrice()),
        quantity_available: Number(this.qty()),
        accepted_count: 0,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        current_user_accepted: false,
      });
      this.toast.success('Offer placed successfully!');
    }, 700);
  }

  protected onQtyChange(e: Event) { this.qty.set((e.target as HTMLInputElement).value); }
  protected onPriceChange(e: Event) { this.price.set((e.target as HTMLInputElement).value); }
  protected onMinPriceChange(e: Event) { this.minPrice.set((e.target as HTMLInputElement).value); }
}
