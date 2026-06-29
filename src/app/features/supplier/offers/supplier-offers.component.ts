import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { MyOfferDto, MyOffersPagedResponse } from '../../../core/models';

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

  protected tab = signal<'active' | 'pending' | 'inactive' | 'expired'>('active');
  protected offers = signal<MyOfferDto[]>([]);
  protected offerImages = signal<Record<string, string[]>>({});

  protected filteredOffers = computed(() => this.offers().filter(o => {
    if (this.tab() === 'active') return o.status === 'Active';
    if (this.tab() === 'pending') return o.status === 'PendingReview';
    if (this.tab() === 'inactive') return o.status === 'Inactive';
    if (this.tab() === 'expired') return o.status === 'Expired';
    return false;
  }));

  ngOnInit(): void {
    this.offersService.getMyOffers().subscribe(res => {
      const offs = res.items || [];
      this.offers.set(offs);
      
      // Load details for each offer to get image URLs without modifying the backend MyOfferDto
      offs.forEach(o => {
        this.offersService.getOfferById(o.id).subscribe({
          next: (detail) => {
            if (detail.images && detail.images.length > 0) {
              this.offerImages.update(prev => ({
                ...prev,
                [o.id]: detail.images
              }));
            }
          }
        });
      });
    });
  }

  protected progress(o: MyOfferDto) {
    return o.batchTargetQuantity > 0 ? Math.round((o.committedUnits / o.batchTargetQuantity) * 100) : 0;
  }
}
