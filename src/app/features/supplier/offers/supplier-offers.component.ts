import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { MyOfferDto } from '../../../core/models';

@Component({
  selector: 'app-supplier-offers',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-offers.component.html',
  styleUrl: './supplier-offers.component.css'
})
export class SupplierOffersComponent implements OnInit {
  private offersService = inject(OffersService);

  protected tab = signal<'active' | 'inactive' | 'expired'>('active');
  protected offers = signal<MyOfferDto[]>([]);

  protected filteredOffers = computed(() => this.offers().filter(o => {
    if (this.tab() === 'active') return o.status === 'Active';
    if (this.tab() === 'inactive') return o.status === 'Inactive';
    if (this.tab() === 'expired') return o.status === 'Expired';
    return false;
  }));

  ngOnInit(): void {
    this.offersService.getMyOffers().subscribe(offs => {
      this.offers.set(offs);
    });
  }

  protected progress(o: MyOfferDto) {
    return o.batchTargetQuantity > 0 ? Math.round((o.committedUnits / o.batchTargetQuantity) * 100) : 0;
  }
}
