import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_OFFERS, Offer } from '../../../core/mock-data';

@Component({
  selector: 'app-manage-offer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-offer.component.html',
  styleUrl: './manage-offer.component.css'
})
export class ManageOfferComponent {
  protected router = inject(Router);
  protected offer = signal<Offer>(MOCK_OFFERS[0]);

  protected progress() {
    const o = this.offer();
    return o.hub_target_quantity > 0 ? Math.round((o.committed_units / o.hub_target_quantity) * 100) : 0;
  }
}
