import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { AuthService } from '../../../core/auth.service';
import { GroupRequestDetailDto } from '../../../core/models';
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
export class ManageRequestComponent implements OnInit {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private groupRequestsService = inject(GroupRequestsService);
  protected authService = inject(AuthService);

  protected request = signal<GroupRequestDetailDto | null>(null);
  protected myOffer = signal<any | null>(null);
  protected loading = signal(false);

  // Form signals
  protected unitPrice = signal<number | null>(null);
  protected minUnitPrice = signal<number | null>(null);
  protected quantityAvailable = signal<number | null>(null);
  protected minFallbackQuantity = signal<number | null>(null);
  protected variantAttributes = signal<string>('');
  protected expiresAt = signal<string>('');

  protected fmtExpiry(d: string) {
    try {
      return format(new Date(d), 'MMM d, ha');
    } catch {
      return '';
    }
  }

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (!requestId) {
      this.toast.error('Error', 'No request ID provided.');
      this.router.navigate(['/supplier/requests']);
      return;
    }

    // Default expiry date to 7 days from now (YYYY-MM-DD)
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    this.expiresAt.set(defaultDate.toISOString().substring(0, 10));

    this.loadRequest(requestId);
  }

  private loadRequest(requestId: string) {
    this.loading.set(true);
    this.groupRequestsService.getGroupRequest(requestId).subscribe({
      next: (req) => {
        this.request.set(req);
        
        // Find if this supplier already placed an offer
        const currentUser = this.authService.user();
        if (currentUser && req.offers) {
          const found = req.offers.find(o => o.supplierId === currentUser.id);
          this.myOffer.set(found || null);
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

  protected submitOffer() {
    const req = this.request();
    if (!req) return;

    const price = this.unitPrice();
    const qty = this.quantityAvailable();
    const expiry = this.expiresAt();

    if (!price || price <= 0) {
      this.toast.error('Invalid Price', 'Please enter a valid unit price.');
      return;
    }
    if (!qty || qty <= 0) {
      this.toast.error('Invalid Quantity', 'Please enter a valid quantity available.');
      return;
    }
    if (!expiry) {
      this.toast.error('Invalid Expiry Date', 'Please select an expiry date.');
      return;
    }

    const offerData = {
      unitPrice: price,
      minUnitPrice: this.minUnitPrice() || undefined,
      quantityAvailable: qty,
      minFallbackQuantity: this.minFallbackQuantity() || undefined,
      variantAttributes: this.variantAttributes() || undefined,
      expiresAt: new Date(expiry).toISOString()
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
}
