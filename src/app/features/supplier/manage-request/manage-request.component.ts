import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { GroupRequestOffersService } from '../../../core/services/group-request-offers.service';
import { AuthService } from '../../../core/auth.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { GroupRequestDetailDto, GroupRequestOfferDto } from '../../../core/models';
import { ToastService } from '../../../core/toast.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-manage-request',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-request.component.html',
  styleUrl: './manage-request.component.css'
})
export class ManageRequestComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private groupRequestsService = inject(GroupRequestsService);
  private groupRequestOffersService = inject(GroupRequestOffersService);
  protected authService = inject(AuthService);
  private signalRService = inject(SignalRService);

  protected request = signal<GroupRequestDetailDto | null>(null);
  protected activeOffer = signal<GroupRequestOfferDto | null>(null);
  protected pastOffers = signal<GroupRequestOfferDto[]>([]);
  protected loading = signal(false);
  private requestId = '';
  private unsubRequestUpdate: (() => void) | null = null;

  // Form fields
  protected unitPrice: number | null = null;
  protected minUnitPrice: number | null = null;
  protected quantityAvailable: number | null = null;
  protected minFallbackQuantity: number | null = null;
  protected variantAttributes: string = '';
  protected expiryDurationValue: number = 7;
  protected expiryDurationUnit: string = 'day';


  protected fmtExpiry(d: string | null | undefined) {
    if (!d) return '';
    try {
      const date = new Date(d);
      // Add 3 hours (3 * 60 * 60 * 1000 ms) to match Egypt time (UTC+3)
      const egyptDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
      
      const localRepresentedAsEgypt = new Date(
        egyptDate.getUTCFullYear(),
        egyptDate.getUTCMonth(),
        egyptDate.getUTCDate(),
        egyptDate.getUTCHours(),
        egyptDate.getUTCMinutes(),
        egyptDate.getUTCSeconds()
      );
      return format(localRepresentedAsEgypt, "MMM d, ha 'UTC'");
    } catch {
      return '';
    }
  }

  protected getCapacityFillRate(demand: number | null | undefined): number {
    if (!demand) return 0;
    const offer = this.activeOffer();
    if (!offer || !offer.quantityAvailable) return 0;
    return Math.round((demand / offer.quantityAvailable) * 100);
  }

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('requestId') ?? '';
    if (!this.requestId) {
      this.toast.error('Error', 'No request ID provided.');
      this.router.navigate(['/supplier/requests']);
      return;
    }



    this.loadRequest(this.requestId);

    this.signalRService.joinGroupRequestGroup(this.requestId);
    this.unsubRequestUpdate = this.signalRService.onGroupRequestUpdate((update) => {
      if (update.id === this.requestId) {
        this.request.set(update);
        const currentUser = this.authService.user();
        if (currentUser && update.offers) {
          const supplierOffers = update.offers.filter(o => o.supplierId === currentUser.id);
          const active = supplierOffers.find(o => o.status === 'Open' || o.status === 'PendingSupplierApproval');
          this.activeOffer.set(active || null);
          const past = supplierOffers.filter(o => o.status !== 'Open' && o.status !== 'PendingSupplierApproval')
                                     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.pastOffers.set(past);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.requestId) {
      this.signalRService.leaveGroupRequestGroup(this.requestId);
    }
    this.unsubRequestUpdate?.();
  }

  private loadRequest(requestId: string) {
    this.loading.set(true);
    this.groupRequestsService.getGroupRequest(requestId).subscribe({
      next: (req) => {
        this.request.set(req);
        
        // Find if this supplier already placed an offer
        const currentUser = this.authService.user();
        if (currentUser && req.offers) {
          const supplierOffers = req.offers.filter(o => o.supplierId === currentUser.id);
          const active = supplierOffers.find(o => o.status === 'Open' || o.status === 'PendingSupplierApproval');
          this.activeOffer.set(active || null);
          const past = supplierOffers.filter(o => o.status !== 'Open' && o.status !== 'PendingSupplierApproval')
                                     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.pastOffers.set(past);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to load request details.');
        this.router.navigate(['/supplier/requests']);
        this.loading.set(false);
      }
    });
  }

  protected getCalculatedExpiry(): Date {
    const now = new Date();
    const expiryDate = new Date(now);
    const val = this.expiryDurationValue ?? 0;

    switch (this.expiryDurationUnit) {
      case 'sec':
        expiryDate.setUTCSeconds(now.getUTCSeconds() + val);
        break;
      case 'min':
        expiryDate.setUTCMinutes(now.getUTCMinutes() + val);
        break;
      case 'hour':
        expiryDate.setUTCHours(now.getUTCHours() + val);
        break;
      case 'day':
        expiryDate.setUTCDate(now.getUTCDate() + val);
        break;
      case 'week':
        expiryDate.setUTCDate(now.getUTCDate() + val * 7);
        break;
      case 'month':
        expiryDate.setUTCMonth(now.getUTCMonth() + val);
        break;
      default:
        expiryDate.setUTCDate(now.getUTCDate() + 7);
    }
    return expiryDate;
  }

  protected submitOffer() {
    const req = this.request();
    if (!req) return;

    const price = this.unitPrice;
    const qty = this.quantityAvailable;

    if (!price || price <= 0) {
      this.toast.error('Invalid Price', 'Please enter a valid unit price.');
      return;
    }
    if (!qty || qty <= 0) {
      this.toast.error('Invalid Quantity', 'Please enter a valid quantity available.');
      return;
    }
    if (!this.expiryDurationValue || this.expiryDurationValue <= 0) {
      this.toast.error('Invalid Expiry', 'Please enter a valid duration.');
      return;
    }

    const expiry = this.getCalculatedExpiry().toISOString();

    const offerData = {
      unitPrice: price,
      minUnitPrice: this.minUnitPrice || undefined,
      quantityAvailable: qty,
      minFallbackQuantity: this.minFallbackQuantity || undefined,
      variantAttributes: this.variantAttributes || undefined,
      expiresAt: expiry
    };

    this.groupRequestsService.placeOffer(req.id, offerData).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Success', 'Your offer has been placed successfully.');
          this.loadRequest(req.id);
        } else {
          this.toast.error('Error', res.error || 'Failed to place offer.');
        }
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || err?.error?.error || 'Failed to place offer.');
      }
    });
  }


  protected triggerDemoExpiry() {
    const offer = this.activeOffer();
    if (!offer) return;
    this.loading.set(true);
    this.groupRequestOffersService.triggerNegotiation(offer.id).subscribe({
      next: () => {
        this.toast.success('Expiry Triggered', 'Instant expiry and AI negotiation round has been executed.');
        this.loadRequest(this.requestId);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Error', err?.error?.detail || 'Failed to trigger negotiation.');
      }
    });
  }

  protected approveAIProposal() {
    const offer = this.activeOffer();
    if (!offer) return;
    this.loading.set(true);
    this.groupRequestOffersService.approveNegotiation(offer.id).subscribe({
      next: () => {
        this.toast.success('AI Price Approved', 'The offer has been placed live at the AI-negotiated price.');
        this.loadRequest(this.requestId);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Error', err?.error?.detail || 'Failed to approve AI proposal.');
      }
    });
  }

  protected rejectAIProposal() {
    const offer = this.activeOffer();
    if (!offer) return;
    this.loading.set(true);
    this.groupRequestOffersService.rejectNegotiation(offer.id).subscribe({
      next: () => {
        this.toast.success('AI Price Rejected', 'The negotiation proposal has been rejected and the offer has ended.');
        this.loadRequest(this.requestId);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Error', err?.error?.detail || 'Failed to reject AI proposal.');
      }
    });
  }
}
