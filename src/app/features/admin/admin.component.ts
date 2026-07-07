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

  // Tabs: 'offers' | 'requests' | 'pending-offers' | 'pending-requests' | 'create-admin'
  protected activeTab = signal<'offers' | 'requests' | 'pending-offers' | 'pending-requests' | 'create-admin'>('offers');
  
  // Data
  protected flaggedOffers = signal<FlaggedOfferDto[]>([]);
  protected flaggedRequests = signal<FlaggedGroupRequestDto[]>([]);
  protected pendingOffers = signal<FlaggedOfferDto[]>([]);
  protected pendingRequests = signal<FlaggedGroupRequestDto[]>([]);
  
  // Pagination
  protected offersPage = signal(1);
  protected requestsPage = signal(1);
  protected pendingOffersPage = signal(1);
  protected pendingRequestsPage = signal(1);
  protected pageSize = 10;
  protected totalOffers = signal(0);
  protected totalRequests = signal(0);
  protected totalPendingOffers = signal(0);
  protected totalPendingRequests = signal(0);

  // Create admin fields
  protected adminEmail = signal('');
  protected adminPassword = signal('');
  protected adminFirstName = signal('');
  protected adminLastName = signal('');

  protected searchQuery = signal('');

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
    if (this.activeTab() === 'create-admin') {
      return;
    }
    this.loading.set(true);
    if (this.activeTab() === 'offers') {
      this.adminService.getFlaggedOffers(this.offersPage(), this.pageSize, this.searchQuery()).subscribe({
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
    } else if (this.activeTab() === 'requests') {
      this.adminService.getFlaggedGroupRequests(this.requestsPage(), this.pageSize, this.searchQuery()).subscribe({
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
    } else if (this.activeTab() === 'pending-offers') {
      this.adminService.getPendingOffers(this.pendingOffersPage(), this.pageSize, this.searchQuery()).subscribe({
        next: (res) => {
          this.pendingOffers.set(res.items);
          this.totalPendingOffers.set(res.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.errorApi('Failed to load pending offers', err);
          this.loading.set(false);
        }
      });
    } else if (this.activeTab() === 'pending-requests') {
      this.adminService.getPendingGroupRequests(this.pendingRequestsPage(), this.pageSize, this.searchQuery()).subscribe({
        next: (res) => {
          this.pendingRequests.set(res.items);
          this.totalPendingRequests.set(res.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.errorApi('Failed to load pending requests', err);
          this.loading.set(false);
        }
      });
    }
  }

  protected setTab(tab: 'offers' | 'requests' | 'pending-offers' | 'pending-requests' | 'create-admin') {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.offersPage.set(1);
    this.requestsPage.set(1);
    this.pendingOffersPage.set(1);
    this.pendingRequestsPage.set(1);
    this.loadData();
  }

  protected onSearchChange(term: string) {
    this.searchQuery.set(term);
    this.offersPage.set(1);
    this.requestsPage.set(1);
    this.pendingOffersPage.set(1);
    this.pendingRequestsPage.set(1);
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

  protected submitCreateAdmin() {
    const email = this.adminEmail().trim();
    const password = this.adminPassword();
    const firstName = this.adminFirstName().trim();
    const lastName = this.adminLastName().trim();

    if (!email || !password || !firstName || !lastName) {
      this.toast.show('Validation Error', 'Please fill in all fields.', 'warning');
      return;
    }

    this.actionInProgress.set(true);
    this.adminService.createAdmin({ email, password, firstName, lastName }).subscribe({
      next: () => {
        this.toast.success('Admin Created', `New admin account for ${email} has been created.`);
        this.adminEmail.set('');
        this.adminPassword.set('');
        this.adminFirstName.set('');
        this.adminLastName.set('');
        this.actionInProgress.set(false);
      },
      error: (err) => {
        this.toast.errorApi('Failed to create admin', err);
        this.actionInProgress.set(false);
      }
    });
  }

  // Page navigation helper properties
  protected get totalPages(): number {
    let total = 0;
    if (this.activeTab() === 'offers') {
      total = this.totalOffers();
    } else if (this.activeTab() === 'requests') {
      total = this.totalRequests();
    } else if (this.activeTab() === 'pending-offers') {
      total = this.totalPendingOffers();
    } else if (this.activeTab() === 'pending-requests') {
      total = this.totalPendingRequests();
    }
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  protected get currentPage(): number {
    if (this.activeTab() === 'offers') {
      return this.offersPage();
    } else if (this.activeTab() === 'requests') {
      return this.requestsPage();
    } else if (this.activeTab() === 'pending-offers') {
      return this.pendingOffersPage();
    } else if (this.activeTab() === 'pending-requests') {
      return this.pendingRequestsPage();
    }
    return 1;
  }

  protected changePage(delta: number) {
    if (this.activeTab() === 'offers') {
      const nextPage = this.offersPage() + delta;
      if (nextPage >= 1 && nextPage <= this.totalPages) {
        this.offersPage.set(nextPage);
        this.loadData();
      }
    } else if (this.activeTab() === 'requests') {
      const nextPage = this.requestsPage() + delta;
      if (nextPage >= 1 && nextPage <= this.totalPages) {
        this.requestsPage.set(nextPage);
        this.loadData();
      }
    } else if (this.activeTab() === 'pending-offers') {
      const nextPage = this.pendingOffersPage() + delta;
      if (nextPage >= 1 && nextPage <= this.totalPages) {
        this.pendingOffersPage.set(nextPage);
        this.loadData();
      }
    } else if (this.activeTab() === 'pending-requests') {
      const nextPage = this.pendingRequestsPage() + delta;
      if (nextPage >= 1 && nextPage <= this.totalPages) {
        this.pendingRequestsPage.set(nextPage);
        this.loadData();
      }
    }
  }
}
