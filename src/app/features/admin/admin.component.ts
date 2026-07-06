import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/toast.service';
import { FlaggedOfferDto, FlaggedGroupRequestDto } from '../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  // Tabs: 'offers' | 'requests'
  protected activeTab = signal<'offers' | 'requests'>('offers');
  
  // Data
  protected flaggedOffers = signal<FlaggedOfferDto[]>([]);
  protected flaggedRequests = signal<FlaggedGroupRequestDto[]>([]);
  
  // Pagination
  protected offersPage = signal(1);
  protected requestsPage = signal(1);
  protected pageSize = 10;
  protected totalOffers = signal(0);
  protected totalRequests = signal(0);

  // Loading/saving states
  protected loading = signal(false);
  protected actionInProgress = signal(false);

  // Rejection modal state
  protected rejectModalOpen = signal(false);
  protected rejectReason = signal('');
  protected currentRejectType = signal<'offer' | 'request'>('offer');
  private currentRejectId = '';

  ngOnInit() {
    this.loadData();
  }

  protected loadData() {
    this.loading.set(true);
    if (this.activeTab() === 'offers') {
      this.adminService.getFlaggedOffers(this.offersPage(), this.pageSize).subscribe({
        next: (res) => {
          this.flaggedOffers.set(res.items);
          this.totalOffers.set(res.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.errorApi('Failed to load flagged offers', err);
          this.loading.set(false);
        }
      });
    } else {
      this.adminService.getFlaggedGroupRequests(this.requestsPage(), this.pageSize).subscribe({
        next: (res) => {
          this.flaggedRequests.set(res.items);
          this.totalRequests.set(res.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.errorApi('Failed to load flagged requests', err);
          this.loading.set(false);
        }
      });
    }
  }

  protected setTab(tab: 'offers' | 'requests') {
    this.activeTab.set(tab);
    this.loadData();
  }

  protected approve(id: string, type: 'offer' | 'request') {
    this.actionInProgress.set(true);
    const obs = type === 'offer' 
      ? this.adminService.approveOffer(id) 
      : this.adminService.approveGroupRequest(id);

    obs.subscribe({
      next: () => {
        this.toast.success('Approved successfully', `The flagged ${type} has been approved.`);
        this.actionInProgress.set(false);
        this.loadData();
      },
      error: (err) => {
        this.toast.errorApi('Approval failed', err);
        this.actionInProgress.set(false);
      }
    });
  }

  protected openRejectModal(id: string, type: 'offer' | 'request') {
    this.currentRejectId = id;
    this.currentRejectType.set(type);
    this.rejectReason.set('');
    this.rejectModalOpen.set(true);
  }

  protected closeRejectModal() {
    this.rejectModalOpen.set(false);
    this.rejectReason.set('');
  }

  protected submitReject() {
    const reason = this.rejectReason().trim();
    if (!reason) {
      this.toast.show('Rejection Reason Required', 'Please enter a reason for rejecting this item.', 'warning');
      return;
    }

    this.actionInProgress.set(true);
    const obs = this.currentRejectType() === 'offer'
      ? this.adminService.rejectOffer(this.currentRejectId, reason)
      : this.adminService.rejectGroupRequest(this.currentRejectId, reason);

    obs.subscribe({
      next: () => {
        this.toast.success('Rejected successfully', `The flagged ${this.currentRejectType()} has been rejected.`);
        this.actionInProgress.set(false);
        this.closeRejectModal();
        this.loadData();
      },
      error: (err) => {
        this.toast.errorApi('Rejection failed', err);
        this.actionInProgress.set(false);
      }
    });
  }

  // Page navigation helper properties
  protected get totalPages(): number {
    const total = this.activeTab() === 'offers' ? this.totalOffers() : this.totalRequests();
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  protected get currentPage(): number {
    return this.activeTab() === 'offers' ? this.offersPage() : this.requestsPage();
  }

  protected changePage(delta: number) {
    if (this.activeTab() === 'offers') {
      const nextPage = this.offersPage() + delta;
      if (nextPage >= 1 && nextPage <= this.totalPages) {
        this.offersPage.set(nextPage);
        this.loadData();
      }
    } else {
      const nextPage = this.requestsPage() + delta;
      if (nextPage >= 1 && nextPage <= this.totalPages) {
        this.requestsPage.set(nextPage);
        this.loadData();
      }
    }
  }
}
