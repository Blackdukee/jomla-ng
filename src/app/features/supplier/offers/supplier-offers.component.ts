import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_SUPPLIER_OFFERS, Offer } from '../../../core/mock-data';

@Component({
  selector: 'app-supplier-offers',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-offers.component.html',
  styleUrl: './supplier-offers.component.css'
})
export class SupplierOffersComponent {
  protected tab = signal<'active' | 'inactive' | 'expired'>('active');
  protected filteredOffers = computed(() => MOCK_SUPPLIER_OFFERS.filter(o => {
    if (this.tab() === 'active') return o.status === 'open';
    if (this.tab() === 'expired') return o.status === 'failed';
    return false;
  }));

  protected progress(o: Offer) {
    return o.hub_target_quantity > 0 ? Math.round((o.committed_units / o.hub_target_quantity) * 100) : 0;
  }
}
