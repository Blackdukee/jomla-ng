import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CloudinaryPipe } from '../../../shared/pipes/cloudinary.pipe';
import { OffersService } from '../../../core/services/offers.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { MyOfferDto, SupplierGroupRequestOfferDto } from '../../../core/models';

@Component({
  selector: 'app-supplier-offers',
  standalone: true,
  imports: [RouterLink, CloudinaryPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-offers.component.html',
  styleUrl: './supplier-offers.component.css'
})
export class SupplierOffersComponent implements OnInit, OnDestroy {
  private offersService = inject(OffersService);
  private groupRequestsService = inject(GroupRequestsService);
  private signalRService = inject(SignalRService);

  protected offerType = signal<'deals' | 'bids'>('deals');
  protected tab = signal<'active' | 'pending' | 'inactive' | 'expired'>('active');
  protected offers = signal<MyOfferDto[]>([]);
  protected groupRequestBids = signal<SupplierGroupRequestOfferDto[]>([]);
  protected isLoading = signal(true);
  private unsubOfferStatusChange: (() => void) | null = null;

  protected filteredOffers = computed(() => this.offers().filter(o => {
    if (this.tab() === 'active') return o.status === 'Active';
    if (this.tab() === 'pending') return o.status === 'PendingReview';
    if (this.tab() === 'inactive') return o.status === 'Inactive';
    if (this.tab() === 'expired') return o.status === 'Expired';
    return false;
  }));

  ngOnInit(): void {
    this.loadOffers();
    this.loadGroupRequestBids();

    this.unsubOfferStatusChange = this.signalRService.onOfferStatusChange((updatedOffer) => {
      this.loadOffers();
      this.loadGroupRequestBids();
    });
  }

  private loadOffers(): void {
    this.isLoading.set(true);
    this.offersService.getMyOffers().subscribe({
      next: (res) => {
        const offs = res.items || [];
        this.offers.set(offs);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load offers', err);
        this.isLoading.set(false);
      }
    });
  }

  private loadGroupRequestBids(): void {
    this.isLoading.set(true);
    this.groupRequestsService.getMyPlacedOffers().subscribe({
      next: (res) => {
        this.groupRequestBids.set(res.items || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load group request bids', err);
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubOfferStatusChange?.();
  }

  protected progress(o: MyOfferDto) {
    return o.batchTargetQuantity > 0 ? Math.round((o.committedUnits / o.batchTargetQuantity) * 100) : 0;
  }

  protected fmtDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
