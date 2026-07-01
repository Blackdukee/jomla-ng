import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CategoriesService } from '../../../core/services/categories.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { CategoryDto, GroupRequestListItemDto } from '../../../core/models';

@Component({
  selector: 'app-supplier-requests',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('requestsEntrance', [
      transition(':enter', [
        query('.header-block, .filters-block', [
          style({ opacity: 0, transform: 'translateY(12px)' }),
          stagger('120ms', [
            animate('1000ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query('.req-row', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger('150ms', [
            animate('1200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  templateUrl: './supplier-requests.component.html',
  styleUrl: './supplier-requests.component.css'
})
export class SupplierRequestsComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private groupRequestsService = inject(GroupRequestsService);

  protected catFilter = signal('all');
  protected sort = signal('newest');
  protected searchQuery = signal('');
  protected categories = signal<CategoryDto[]>([]);
  protected requests = signal<GroupRequestListItemDto[]>([]);

  // Pagination State
  protected pageNumber = signal(1);
  protected readonly pageSize = 5;
  protected totalItems = signal(0);
  protected totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });

    this.loadRequests();
  }

  protected loadRequests(): void {
    const categoryId = this.catFilter() === 'all' ? undefined : this.catFilter();
    this.groupRequestsService.getGroupRequests({
      categoryId,
      titleSearch: this.searchQuery() || undefined,
      sortBy: this.sort(),
      page: this.pageNumber(),
      pageSize: this.pageSize,
      status: 'Active'
    }).subscribe({
      next: (res) => {
        this.requests.set(res.items);
        this.totalItems.set(res.totalCount);
      },
      error: (err) => console.error('Failed to load group requests', err)
    });
  }

  protected onCatChange(e: Event) {
    this.catFilter.set((e.target as HTMLSelectElement).value);
    this.pageNumber.set(1);
    this.loadRequests();
  }

  protected onSortChange(e: Event) {
    this.sort.set((e.target as HTMLSelectElement).value);
    this.pageNumber.set(1);
    this.loadRequests();
  }

  protected onSearchInput(e: Event) {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.pageNumber.set(1);
    this.loadRequests();
  }

  protected prevPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(p => p - 1);
      this.loadRequests();
    }
  }

  protected nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(p => p + 1);
      this.loadRequests();
    }
  }
}
