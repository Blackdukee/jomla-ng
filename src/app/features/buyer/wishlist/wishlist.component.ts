import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../../core/toast.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryDto, GroupRequestFilterParams, GroupRequestListItemDto } from '../../../core/models';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  private toast = inject(ToastService);
  private groupRequestsService = inject(GroupRequestsService);
  private categoriesService = inject(CategoriesService);

  protected requests = signal<GroupRequestListItemDto[]>([]);
  protected categories = signal<CategoryDto[]>([]);
  protected modalOpen = signal(false);
  protected title = signal('');
  protected desc = signal('');
  protected qty = signal('');
  protected detecting = signal(false);
  protected detectedCat = signal<string | null>(null);
  protected selectedCategoryId = signal<string | null>(null);
  protected isSelectingCategory = signal(false);

  protected selectedFiles = signal<File[]>([]);
  protected images = signal<string[]>([]);
  protected isDragging = signal(false);

  // Filters and Pagination
  protected searchQuery = signal('');
  protected categoryId = signal('');
  protected statusFilter = signal('');
  protected page = signal(1);
  protected pageSize = 5;
  protected totalCount = signal(0);
  protected totalWishlistCount = signal(0);
  protected activeGroupsCount = signal(0);
  protected isLoading = signal(true);

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
    this.loadStats();
  }

  protected loadStats() {
    forkJoin({
      total: this.groupRequestsService.getGroupRequests({
        page: 1,
        pageSize: 1,
        myRequestsOnly: true
      }),
      active: this.groupRequestsService.getGroupRequests({
        page: 1,
        pageSize: 1,
        myRequestsOnly: true,
        status: 'Active'
      })
    }).subscribe({
      next: ({ total, active }) => {
        this.totalWishlistCount.set(total.totalCount ?? 0);
        this.activeGroupsCount.set(active.totalCount ?? 0);
      },
      error: (err) => console.error('Failed to load wishlist stats', err)
    });
  }

  protected loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  protected loadRequests() {
    this.isLoading.set(true);
    const filters: GroupRequestFilterParams = {
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
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load my requests', err);
        this.isLoading.set(false);
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
    this.selectedCategoryId.set(null);
    this.isSelectingCategory.set(false);
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
        this.selectedCategoryId.set(cat.id);
      },
      error: () => {
        this.detecting.set(false);
        this.detectedCat.set('Other');
        const otherCat = this.categories().find(c => c.name.toLowerCase() === 'other');
        this.selectedCategoryId.set(otherCat ? otherCat.id : null);
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

  private isValidImage(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(file.type)) {
      this.toast.error('Invalid file format', `${file.name} is not a supported image format. Please upload JPEG, PNG, WEBP, or GIF.`);
      return false;
    }

    if (file.size > maxSizeBytes) {
      this.toast.error('File too large', `${file.name} exceeds the 5MB size limit.`);
      return false;
    }

    return true;
  }

  private processFiles(files: FileList) {
    const maxAdd = 8 - this.images().length;
    const addedFiles = Array.from(files).slice(0, maxAdd);
    addedFiles.forEach(file => {
      if (!this.isValidImage(file)) return;
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
      images: this.selectedFiles().length > 0 ? this.selectedFiles() : null,
      categoryId: this.selectedCategoryId() || null
    }).subscribe({
      next: () => {
        this.toast.success('Request posted!', 'Your group request is now live.');
        this.closeModal();
        this.loadRequests();
        this.loadStats();
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

  protected onManualCategorySelect(e: Event) {
    const select = e.target as HTMLSelectElement;
    const catId = select.value;
    if (catId) {
      const cat = this.categories().find(c => c.id === catId);
      if (cat) {
        this.detectedCat.set(cat.name);
        this.selectedCategoryId.set(cat.id);
      }
    }
    this.isSelectingCategory.set(false);
  }
}
