import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  protected catFilter = signal('all');
  protected sort = signal('newest');
  protected categories = signal<CategoryDto[]>([]);
  protected requests = signal<GroupRequestListItemDto[]>([]);

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });

    this.groupRequestsService.getGroupRequests().subscribe({
      next: (res) => this.requests.set(res.items),
      error: (err) => console.error('Failed to load group requests', err)
    });
  }

  protected filteredRequests = computed(() => {
    let list = [...this.requests()];
    if (this.catFilter() !== 'all') {
      list = list.filter(r => r.categoryName === this.catFilter());
    }
    if (this.sort() === 'most_buyers') {
      list.sort((a, b) => b.participantsCount - a.participantsCount);
    } else if (this.sort() === 'most_units') {
      list.sort((a, b) => b.currentQuantity - a.currentQuantity);
    } else if (this.sort() === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  });

  protected onCatChange(e: Event) {
    this.catFilter.set((e.target as HTMLSelectElement).value);
  }

  protected onSortChange(e: Event) {
    this.sort.set((e.target as HTMLSelectElement).value);
  }
}
