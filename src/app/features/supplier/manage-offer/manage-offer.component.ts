import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MOCK_OFFERS, MOCK_SUPPLIER_OFFERS, Offer } from '../../../core/mock-data';
import { format } from 'date-fns';

@Component({
  selector: 'app-manage-offer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-offer.component.html',
  styleUrl: './manage-offer.component.css'
})
export class ManageOfferComponent {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);

  protected offer = signal<Offer | null>(null);

  constructor() {
    const offerIdStr = this.route.snapshot.paramMap.get('offerId');
    if (offerIdStr) {
      const id = Number(offerIdStr);
      const found = MOCK_SUPPLIER_OFFERS.find(o => o.id === id) || MOCK_OFFERS.find(o => o.id === id);
      if (found) {
        this.offer.set(found);
      } else {
        // Fallback mockup to match the custom created "test" offer in user's screenshot
        this.offer.set({
          id: id,
          title: 'test',
          description: 'test test test',
          category_id: 5,
          category_name: 'Food & Beverage',
          supplier_id: 99,
          supplier_name: 'My Company',
          unit_price: 200,
          discount_percent: 20,
          discounted_price: 160,
          hub_target_quantity: 20,
          total_quantity_available: 200,
          committed_units: 0,
          buyer_count: 0,
          current_batch_id: 1,
          image_url: 'chihuahua_cover.png',
          status: 'open',
          expires_at: '2026-06-25T23:45:00', // local date string
        });
      }
    } else {
      this.offer.set(MOCK_OFFERS[0]);
    }
  }

  protected fmtDate(d: string | undefined): string {
    if (!d) return '';
    try {
      return format(new Date(d), 'MMM d, yyyy');
    } catch {
      return '';
    }
  }

  protected fmtExpiryLong(d: string | undefined): string {
    if (!d) return '';
    try {
      return format(new Date(d), 'MMM d, yyyy h:mm a');
    } catch {
      return '';
    }
  }
}
