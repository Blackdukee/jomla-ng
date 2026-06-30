import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { GroupRequestListItemDto } from '../../../core/models';

import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('wishlistEntrance', [
      transition(':enter', [
        query('.header-block', [
          style({ opacity: 0, transform: 'translateY(12px)' }),
          stagger('120ms', [
            animate('2000ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query('.req-row', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger('150ms', [
            animate('2200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  private toast = inject(ToastService);
  private groupRequestsService = inject(GroupRequestsService);
  private categoriesService = inject(CategoriesService);

  protected requests = signal<GroupRequestListItemDto[]>([]);
  protected categories = signal<any[]>([]);
  protected modalOpen = signal(false);
  protected title = signal('');
  protected desc = signal('');
  protected qty = signal('');
  protected detecting = signal(false);
  protected detectedCat = signal<string | null>(null);

  protected selectedFiles = signal<File[]>([]);
  protected images = signal<string[]>([]);
  protected isDragging = signal(false);

  // Filters and Pagination
  protected searchQuery = signal('');
  protected categoryId = signal('');
  protected statusFilter = signal('Active');
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

  ngOnInit(): void {
    this.loadCategories();
    this.loadRequests();
  }

  protected loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  protected loadRequests() {
    const filters: any = {
      pageSize: this.pageSize,
      page: this.page(),
      myRequestsOnly: true
    };
    if (this.statusFilter() && this.statusFilter() !== 'All') filters.status = this.statusFilter();
    if (this.searchQuery().trim()) filters.titleSearch = this.searchQuery().trim();
    if (this.categoryId()) filters.categoryId = this.categoryId();

    this.groupRequestsService.getGroupRequests(filters).subscribe({
      next: (res) => {
        this.requests.set(res.items);
        this.totalCount.set(res.totalCount);
      },
      error: (err) => {
        this.toast.error('Error', 'Failed to load wishlist items.');
      }
    });
  }

  protected onSearchChange(e: Event) {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    this.loadRequests();
  }

  protected onCategoryChange(e: Event) {
    this.categoryId.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadRequests();
  }

  protected onStatusChange(e: Event) {
    this.statusFilter.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadRequests();
  }

  protected changePage(p: number) {
    this.page.set(p);
    this.loadRequests();
  }


  protected closeModal() {
    this.modalOpen.set(false);
    this.title.set('');
    this.desc.set('');
    this.qty.set('');
    this.detectedCat.set(null);
    this.selectedFiles.set([]);
    this.images.set([]);
  }

  protected detectCategory() {
    if (!this.title() || this.detecting()) return;
    this.detecting.set(true);
    this.categoriesService.detectCategory(this.title()).subscribe({
      next: (cat) => {
        this.detecting.set(false);
        this.detectedCat.set(cat.name);
      },
      error: () => {
        this.detecting.set(false);
        this.detectedCat.set('Other');
      }
    });
  }

  protected removeImage(i: number) {
    this.images.update(imgs => imgs.filter((_, idx) => idx !== i));
    this.selectedFiles.update(files => files.filter((_, idx) => idx !== i));
  }

  protected onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  protected onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    if (e.dataTransfer?.files) this.processFiles(e.dataTransfer.files);
  }

  protected onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) this.processFiles(input.files);
  }

  private processFiles(files: FileList) {
    const maxAdd = 8 - this.images().length;
    const addedFiles = Array.from(files).slice(0, maxAdd);
    addedFiles.forEach(file => {
      this.selectedFiles.update(current => [...current, file]);
      const reader = new FileReader();
      reader.onload = () => this.images.update(imgs => [...imgs, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  protected submitRequest() {
    const qtyNum = Number(this.qty());
    if (!this.title() || qtyNum <= 0) return;

    this.groupRequestsService.createGroupRequest({
      title: this.title(),
      quantity: qtyNum,
      description: this.desc() || null,
      images: this.selectedFiles().length > 0 ? this.selectedFiles() : null
    }).subscribe({
      next: () => {
        this.toast.success('Request posted!', 'Your group request is now live.');
        this.closeModal();
        this.loadRequests();
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to post request.');
      }
    });
  }

  protected onTitleChange(e: Event) {
    this.title.set((e.target as HTMLInputElement).value);
  }

  protected onDescChange(e: Event) {
    this.desc.set((e.target as HTMLTextAreaElement).value);
  }

  protected onQtyChange(e: Event) {
    this.qty.set((e.target as HTMLInputElement).value);
  }
}
