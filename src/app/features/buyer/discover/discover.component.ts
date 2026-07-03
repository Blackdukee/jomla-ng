import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { OfferDto, CategoryDto, GroupRequestListItemDto } from '../../../core/models';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css'
})
export class DiscoverComponent implements OnInit {
  private offersService = inject(OffersService);
  private categoriesService = inject(CategoriesService);
  private groupRequestsService = inject(GroupRequestsService);
  private router = inject(Router);

  protected tab = signal<'offers' | 'requests'>('offers');
  protected catFilter = signal('all'); // Holds 'all' or selected CategoryId (Guid)
  protected sort = signal('newest'); // 'newest' | 'most_buyers' | 'most_filled'
  protected searchTerm = signal('');

  protected isLoadingOffers = signal(true);
  protected isLoadingRequests = signal(true);

  protected categories = signal<CategoryDto[]>([]);
  protected offers = signal<OfferDto[]>([]);
  protected requests = signal<GroupRequestListItemDto[]>([]);

  // Pagination state (Offers)
  protected pageNumber = signal(1);
  protected pageSize = signal(6);
  protected totalCountOffers = signal(0);

  protected totalPages = computed(() => {
    return Math.ceil(this.totalCountOffers() / this.pageSize()) || 1;
  });

  protected pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  // Pagination state (Requests)
  protected pageNumberRequests = signal(1);
  protected pageSizeRequests = signal(6);
  protected totalCountRequests = signal(0);

  protected totalPagesRequests = computed(() => {
    return Math.ceil(this.totalCountRequests() / this.pageSizeRequests()) || 1;
  });

  protected pagesArrayRequests = computed(() => {
    const total = this.totalPagesRequests();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe(cats => {
      this.categories.set(cats);
    });

    this.loadOffers();
    this.loadRequests();
  }

  protected loadOffers(): void {
    this.isLoadingOffers.set(true);
    const categoryId = this.catFilter() === 'all' ? undefined : this.catFilter();
    const search = this.searchTerm().trim() || undefined;

    this.offersService.getAllOffers({
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      search,
      categoryId,
      sortBy: this.getOffersSortBy(),
      descending: true
    }).subscribe({
      next: (res) => {
        this.offers.set(res.items || []);
        this.totalCountOffers.set(res.totalCount || 0);
        this.isLoadingOffers.set(false);
      },
      error: (err) => {
        console.error('Failed to load offers', err);
        this.isLoadingOffers.set(false);
      }
    });
  }

  protected loadRequests(): void {
    this.isLoadingRequests.set(true);
    const categoryId = this.catFilter() === 'all' ? undefined : this.catFilter();
    const search = this.searchTerm().trim() || undefined;

    this.groupRequestsService.getGroupRequests({
      page: this.pageNumberRequests(),
      pageSize: this.pageSizeRequests(),
      titleSearch: search,
      categoryId,
      sortBy: this.sort()
    }).subscribe({
      next: (res) => {
        this.requests.set(res.items || []);
        this.totalCountRequests.set(res.totalCount || 0);
        this.isLoadingRequests.set(false);
      },
      error: (err) => {
        console.error('Failed to load group requests', err);
        this.isLoadingRequests.set(false);
      }
    });
  }

  private getOffersSortBy(): string {
    switch (this.sort()) {
      case 'most_buyers':
        return 'MostBuyers';
      case 'most_filled':
        return 'MostFilled';
      case 'newest':
      default:
        return 'CreatedAt';
    }
  }

  protected onSearchInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    if (!val.trim()) {
      this.triggerSearch();
    }
  }

  protected triggerSearch(): void {
    this.pageNumber.set(1);
    this.pageNumberRequests.set(1);
    this.loadOffers();
    this.loadRequests();
  }

  protected onCatChange(e: Event) {
    this.catFilter.set((e.target as HTMLSelectElement).value);
    this.pageNumber.set(1);
    this.pageNumberRequests.set(1);
    this.loadOffers();
    this.loadRequests();
  }

  protected onSortChange(e: Event) {
    this.sort.set((e.target as HTMLSelectElement).value);
    this.pageNumber.set(1);
    this.pageNumberRequests.set(1);
    this.loadOffers();
    this.loadRequests();
  }

  protected goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageNumber.set(page);
      this.loadOffers();
    }
  }

  protected goToPageRequests(page: number) {
    if (page >= 1 && page <= this.totalPagesRequests()) {
      this.pageNumberRequests.set(page);
      this.loadRequests();
    }
  }

  protected progress(o: OfferDto) {
    return o.hubTargetQuantity > 0 ? Math.round((o.committedUnits / o.hubTargetQuantity) * 100) : 0;
  }

  protected goToHub(o: OfferDto) {
    if (o.activeBatchId) {
      this.router.navigate(['/hubs/supplier', o.activeBatchId]);
    }
  }

  protected joinHub(o: OfferDto) {
    if (o.activeBatchId) {
      this.router.navigate(['/hubs/supplier', o.activeBatchId]);
    }
  }
}
