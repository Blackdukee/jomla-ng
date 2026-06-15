import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_OFFERS, Offer } from '../../../core/mock-data';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offer-detail.component.html',
  styleUrl: './offer-detail.component.css'
})
export class OfferDetailComponent {
  protected router = inject(Router);
  protected offer = signal<Offer>(MOCK_OFFERS[0]);

  protected progress() {
    const o = this.offer();
    return o.hub_target_quantity > 0 ? Math.round((o.committed_units / o.hub_target_quantity) * 100) : 0;
  }
}
