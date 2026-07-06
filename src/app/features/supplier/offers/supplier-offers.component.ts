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

  // Pagination for bids
  protected bidsPage = signal(1);
  protected bidsPageSize = 5;
  protected bidsTotalCount = signal(0);

  protected bidsTotalPages = computed(() => {
    return Math.max(1, Math.ceil(this.bidsTotalCount() / this.bidsPageSize));
  });

  protected bidsShowingFrom = computed(() => {
    if (this.bidsTotalCount() === 0) return 0;
    return (this.bidsPage() - 1) * this.bidsPageSize + 1;
  });

  protected bidsShowingTo = computed(() => {
    return Math.min(this.bidsPage() * this.bidsPageSize, this.bidsTotalCount());
  });
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
    this.groupRequestsService.getMyPlacedOffers(this.bidsPage(), this.bidsPageSize).subscribe({
      next: (res) => {
        this.groupRequestBids.set(res.items || []);
        this.bidsTotalCount.set(res.totalCount || 0);
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

  protected changeBidsPage(p: number) {
    this.bidsPage.set(p);
    this.loadGroupRequestBids();
  }

  protected parseAttributes(attributesJson: string | null | undefined): { key: string; value: string }[] {
    if (!attributesJson) return [];
    try {
      const parsed = JSON.parse(attributesJson);
      return Object.entries(parsed).map(([key, value]) => ({
        key: this.capitalize(key),
        value: String(value)
      }));
    } catch {
      return [];
    }
  }

  private capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
