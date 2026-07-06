import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CloudinaryPipe } from '../../../shared/pipes/cloudinary.pipe';
import { OffersService } from '../../../core/services/offers.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { CategoriesService } from '../../../core/services/categories.service';
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
  private categoriesService = inject(CategoriesService);

  protected offerType = signal<'deals' | 'bids'>('deals');
  protected tab = signal<'active' | 'pending' | 'inactive' | 'expired'>('active');
  protected offers = signal<MyOfferDto[]>([]);
  protected groupRequestBids = signal<SupplierGroupRequestOfferDto[]>([]);
  protected isLoading = signal(true);

  // Categories list
  protected categories = signal<any[]>([]);

  // Filtering & Pagination for Deals
  protected offersSearch = signal('');
  protected offersCategoryId = signal('');
  protected offersPage = signal(1);
  protected offersPageSize = 5;
  protected offersTotalCount = signal(0);

  protected offersTotalPages = computed(() => {
    return Math.max(1, Math.ceil(this.offersTotalCount() / this.offersPageSize));
  });

  protected offersShowingFrom = computed(() => {
    if (this.offersTotalCount() === 0) return 0;
    return (this.offersPage() - 1) * this.offersPageSize + 1;
  });

  protected offersShowingTo = computed(() => {
    return Math.min(this.offersPage() * this.offersPageSize, this.offersTotalCount());
  });

  // Filtering & Pagination for Bids
  protected bidsSearch = signal('');
  protected bidsStatus = signal('');
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

  protected filteredOffers = computed(() => this.offers());

  ngOnInit(): void {
    this.loadCategories();
    this.loadOffers();
    this.loadGroupRequestBids();

    this.unsubOfferStatusChange = this.signalRService.onOfferStatusChange((updatedOffer) => {
      this.loadOffers();
      this.loadGroupRequestBids();
    });
  }

  private loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  private loadOffers(): void {
    this.isLoading.set(true);
    let status: string | undefined = undefined;
    if (this.tab() === 'active') status = 'Active';
    else if (this.tab() === 'pending') status = 'PendingReview';
    else if (this.tab() === 'inactive') status = 'Inactive';
    else if (this.tab() === 'expired') status = 'Expired';

    this.offersService.getMyOffers({
      search: this.offersSearch() || undefined,
      categoryId: this.offersCategoryId() || undefined,
      status: status,
      pageNumber: this.offersPage(),
      pageSize: this.offersPageSize
    }).subscribe({
      next: (res) => {
        this.offers.set(res.items || []);
        this.offersTotalCount.set(res.totalCount || 0);
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
    this.groupRequestsService.getMyPlacedOffers(
      this.bidsPage(),
      this.bidsPageSize,
      this.bidsSearch() || undefined,
      this.bidsStatus() || undefined
    ).subscribe({
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

  protected onOffersSearchChange(e: Event) {
    this.offersSearch.set((e.target as HTMLInputElement).value);
    this.offersPage.set(1);
    this.loadOffers();
  }

  protected onOffersCategoryChange(e: Event) {
    this.offersCategoryId.set((e.target as HTMLSelectElement).value);
    this.offersPage.set(1);
    this.loadOffers();
  }

  protected changeOffersPage(p: number) {
    this.offersPage.set(p);
    this.loadOffers();
  }

  protected onTabChange(t: 'active' | 'pending' | 'inactive' | 'expired') {
    this.tab.set(t);
    this.offersPage.set(1);
    this.loadOffers();
  }

  protected onBidsSearchChange(e: Event) {
    this.bidsSearch.set((e.target as HTMLInputElement).value);
    this.bidsPage.set(1);
    this.loadGroupRequestBids();
  }

  protected onBidsStatusChange(e: Event) {
    this.bidsStatus.set((e.target as HTMLSelectElement).value);
    this.bidsPage.set(1);
    this.loadGroupRequestBids();
  }
}
