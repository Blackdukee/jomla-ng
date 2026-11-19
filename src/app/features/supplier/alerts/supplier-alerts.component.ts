import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, EMPTY, debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryDto } from '../../../core/models';
import { formatDistanceToNow } from 'date-fns';
import { parseUtcDate } from '../../../shared/utils/date-time.util';

interface SupplierAlertItem {
  id: string;
  request_id: string;
  status: 'pending' | 'responded';
  category_name: string;
  item_title: string;
  units_demanded: number;
  notified_at: string;
}

@Component({
  selector: 'app-supplier-alerts',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-alerts.component.html',
  styleUrl: './supplier-alerts.component.css'
})
export class SupplierAlertsComponent implements OnInit, OnDestroy {
  private groupRequestsService = inject(GroupRequestsService);
  private signalRService = inject(SignalRService);
  private categoriesService = inject(CategoriesService);
  private destroyRef = inject(DestroyRef);

  private search$ = new Subject<string>();
  private loadTrigger$ = new Subject<void>();

  protected alerts = signal<SupplierAlertItem[]>([]);
  protected isLoading = signal(true);
  protected categories = signal<CategoryDto[]>([]);

  // Filtering & Pagination
  protected searchQuery = signal('');
  protected selectedCategoryId = signal('');
  protected selectedStatus = signal('');
  protected page = signal(1);
  protected pageSize = 5;
  protected totalCount = signal(0);

  protected totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  });

  protected showingFrom = computed(() => {
    if (this.totalCount() === 0) return 0;
    return (this.page() - 1) * this.pageSize + 1;
  });

  protected showingTo = computed(() => {
    return Math.min(this.page() * this.pageSize, this.totalCount());
  });

  private unsubNotification: (() => void) | null = null;

  ngOnInit(): void {
    this.loadTrigger$.pipe(
      switchMap(() => {
        this.isLoading.set(true);
        return this.groupRequestsService.getMatchedGroupRequests(
          this.page(),
          this.pageSize,
          this.searchQuery().trim() || undefined,
          this.selectedCategoryId() || undefined,
          this.selectedStatus() || undefined
        ).pipe(
          tap((res) => {
            const mapped: SupplierAlertItem[] = (res.items || []).map(req => ({
              id: req.id,
              request_id: req.id,
              status: req.status === 'Active' || req.status === 'active' ? 'pending' : 'responded',
              category_name: req.categoryName || 'Uncategorized',
              item_title: req.title || req.description || 'Group Request',
              units_demanded: req.currentQuantity,
              notified_at: req.createdAt
            }));
            this.alerts.set(mapped);
            this.totalCount.set(res.totalCount || 0);
            this.isLoading.set(false);
          }),
          catchError((err) => {
            console.error('Failed to load matched requests', err);
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
      this.page.set(1);
      this.loadAlerts();
    });

    this.loadCategories();
    this.loadAlerts();

    this.unsubNotification = this.signalRService.onNotification((notif) => {
      this.loadAlerts();
    });
  }

  private loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  private loadAlerts(): void {
    this.loadTrigger$.next();
  }

  ngOnDestroy(): void {
    this.unsubNotification?.();
  }

  protected relTime(d: string) {
    const date = parseUtcDate(d);
    if (!date) return '';
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  }

  protected onSearchChange(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.search$.next(val);
  }

  protected onCategoryChange(e: Event) {
    this.selectedCategoryId.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadAlerts();
  }

  protected onStatusChange(e: Event) {
    this.selectedStatus.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadAlerts();
  }

  protected changePage(p: number) {
    this.page.set(p);
    this.loadAlerts();
  }
}
