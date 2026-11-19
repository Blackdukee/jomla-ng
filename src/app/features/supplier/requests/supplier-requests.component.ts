import { Component, ChangeDetectionStrategy, DestroyRef, signal, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, EMPTY, debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs';
import { CategoriesService } from '../../../core/services/categories.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { CategoryDto, GroupRequestListItemDto } from '../../../core/models';

@Component({
  selector: 'app-supplier-requests',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-requests.component.html',
  styleUrl: './supplier-requests.component.css'
})
export class SupplierRequestsComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private groupRequestsService = inject(GroupRequestsService);
  private destroyRef = inject(DestroyRef);

  private search$ = new Subject<string>();
  private loadTrigger$ = new Subject<void>();

  protected catFilter = signal('all');
  protected sort = signal('newest');
  protected searchQuery = signal('');
  protected categories = signal<CategoryDto[]>([]);
  protected requests = signal<GroupRequestListItemDto[]>([]);
  protected isLoading = signal(true);

  // Pagination State
  protected pageNumber = signal(1);
  protected readonly pageSize = 5;
  protected totalItems = signal(0);
  protected totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));

  ngOnInit(): void {
    this.loadTrigger$.pipe(
      switchMap(() => {
        this.isLoading.set(true);
        const categoryId = this.catFilter() === 'all' ? undefined : this.catFilter();
        return this.groupRequestsService.getGroupRequests({
          categoryId,
          titleSearch: this.searchQuery().trim() || undefined,
          sortBy: this.sort(),
          page: this.pageNumber(),
          pageSize: this.pageSize,
          status: 'Active'
        }).pipe(
          tap((res) => {
            this.requests.set(res.items);
            this.totalItems.set(res.totalCount);
            this.isLoading.set(false);
          }),
          catchError((err) => {
            console.error('Failed to load group requests', err);
            this.isLoading.set(false);
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.pageNumber.set(1);
      this.loadRequests();
    });

    this.categoriesService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });

    this.loadRequests();
  }

  protected loadRequests(): void {
    this.loadTrigger$.next();
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
    const val = (e.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.search$.next(val);
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
