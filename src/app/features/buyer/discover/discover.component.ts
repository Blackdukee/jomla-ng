import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MOCK_REQUESTS } from '../../../core/mock-data';
import { OffersService } from '../../../core/services/offers.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { OfferDto, CategoryDto, GroupRequestListItemDto, GetAllOffersPagedResponse } from '../../../core/models';

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
  protected catFilter = signal('all');
  protected sort = signal('newest');
  protected searchTerm = signal('');
  protected isLoading = signal(false);

  protected categories = signal<CategoryDto[]>([]);
  protected offers = signal<OfferDto[]>([]);
  protected requests = signal<GroupRequestListItemDto[]>([]);

  // Pagination state
  protected pageNumber = signal(1);
  protected pageSize = signal(6);

  protected totalPages = computed(() => {
    const list = this.filteredOffers();
    return Math.ceil(list.length / this.pageSize()) || 1;
  });

  protected paginatedOffers = computed(() => {
    const list = this.filteredOffers();
    const start = (this.pageNumber() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  protected pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe(cats => {
      this.categories.set(cats);
    });

    this.loadData();
  }

  protected loadData(): void {
    const term = this.searchTerm().trim();
    this.isLoading.set(true);

    this.offersService.getAllOffers({ search: term || undefined }).subscribe({
      next: (res) => {
        this.offers.set(res.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load offers', err);
        this.isLoading.set(false);
      }
    });

    this.groupRequestsService.getGroupRequests({ titleSearch: term || undefined }).subscribe({
      next: (res) => {
        this.requests.set(res.items);
      },
      error: (err) => console.error('Failed to load group requests', err)
    });
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
    this.loadData();
  }

  protected filteredOffers = computed(() => {
    let list = [...this.offers()];
    if (this.catFilter() !== 'all') {
      list = list.filter(o => o.categoryName === this.catFilter());
    }
    if (this.sort() === 'most_buyers') {
      list.sort((a, b) => b.buyerCount - a.buyerCount);
    } else if (this.sort() === 'most_filled') {
      list.sort((a, b) => {
        const progressA = a.hubTargetQuantity > 0 ? a.committedUnits / a.hubTargetQuantity : 0;
        const progressB = b.hubTargetQuantity > 0 ? b.committedUnits / b.hubTargetQuantity : 0;
        return progressB - progressA;
      });
    }
    return list;
  });

  protected onCatChange(e: Event) {
    this.catFilter.set((e.target as HTMLSelectElement).value);
    this.pageNumber.set(1);
  }
  protected onSortChange(e: Event) {
    this.sort.set((e.target as HTMLSelectElement).value);
    this.pageNumber.set(1);
  }

  protected goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageNumber.set(page);
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
