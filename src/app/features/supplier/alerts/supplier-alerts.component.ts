import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { formatDistanceToNow } from 'date-fns';

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

  protected alerts = signal<any[]>([]);
  protected isLoading = signal(true);
  protected categories = signal<any[]>([]);

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
    this.isLoading.set(true);
    this.groupRequestsService.getMatchedGroupRequests(
      this.page(),
      this.pageSize,
      this.searchQuery() || undefined,
      this.selectedCategoryId() || undefined,
      this.selectedStatus() || undefined
    ).subscribe({
      next: (res) => {
        const mapped = (res.items || []).map(req => ({
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
      },
      error: (err) => {
        console.error('Failed to load matched requests', err);
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubNotification?.();
  }

  protected relTime(d: string) {
    if (!d) return '';
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return '';
    }
  }

  protected onSearchChange(e: Event) {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    this.loadAlerts();
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
