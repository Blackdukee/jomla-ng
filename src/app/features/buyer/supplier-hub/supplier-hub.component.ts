import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BatchesService } from '../../../core/services/batches.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { BatchDetailDto, BatchUpdatedDto } from '../../../core/models';
import { differenceInHours, format } from 'date-fns';

@Component({
  selector: 'app-supplier-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-hub.component.html',
  styleUrl: './supplier-hub.component.css'
})
export class SupplierHubComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private batchesService = inject(BatchesService);
  private signalRService = inject(SignalRService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  protected batch = signal<BatchDetailDto | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected leaving = signal(false);
  protected joinModalOpen = signal(false);
  protected joinQty = signal(1);
  protected joining = signal(false);
  protected clientSecret = signal<string | null>(null);

  protected updateQtyModalOpen = signal(false);
  protected updateQty = signal(1);
  protected updatingQty = signal(false);

  private batchId = '';
  private unsubBatchUpdate: (() => void) | null = null;
  private stripe: any = null;
  private cardElement: any = null;

  ngOnInit(): void {
    this.batchId = this.route.snapshot.paramMap.get('batchId') ?? '';
    if (!this.batchId) {
      this.error.set('No batch ID provided');
      this.loading.set(false);
      return;
    }

    this.loadBatch();

    // Subscribe to real-time batch updates
    this.unsubBatchUpdate = this.signalRService.onBatchUpdate((update: BatchUpdatedDto) => {
      if (update.batchId === this.batchId) {
        // Refresh from server to get updated participant list
        this.loadBatch();
      }
    });

    // Join SignalR offer group for this batch's offer (will be set after batch loads)
  }

  ngOnDestroy(): void {
    this.unsubBatchUpdate?.();
    const b = this.batch();
    if (b) {
      this.signalRService.leaveOfferGroup(b.offerId);
    }
  }

  private loadBatch(): void {
    this.batchesService.getBatch(this.batchId).subscribe({
      next: (batch) => {
        this.batch.set(batch);
        this.loading.set(false);
        // Join SignalR group for this offer
        this.signalRService.joinOfferGroup(batch.offerId);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || err?.error?.title || 'Failed to load batch');
        this.loading.set(false);
      }
    });
  }

  protected progress(): number {
    const b = this.batch();
    if (!b || b.targetQuantity <= 0) return 0;
    return Math.round((b.currentQuantity / b.targetQuantity) * 100);
  }

  protected isExpiringSoon(): boolean {
    const b = this.batch();
    if (!b?.expiresAt) return false;
    const h = differenceInHours(new Date(b.expiresAt), new Date());
    return h < 1 && h >= 0;
  }

  protected expiresFormatted(): string {
    const b = this.batch();
    if (!b?.expiresAt) return 'No expiry set';
    return format(new Date(b.expiresAt), 'MMM d, h:mm a');
  }

  protected isCurrentUser(buyerId: string): boolean {
    return this.authService.user()?.id === buyerId;
  }

  protected isParticipant(): boolean {
    const userId = this.authService.user()?.id;
    if (!userId) return false;
    return this.batch()?.participants.some(p => p.buyerId === userId) ?? false;
  }

  protected leave(): void {
    this.leaving.set(true);
    this.batchesService.leaveBatch(this.batchId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Left hub', 'You have left this group deal. Your payment hold has been released.');
          this.leaving.set(false);
          this.router.navigate(['/my-hubs']);
        } else {
          this.toast.error('Error', res.error || 'Failed to leave batch');
          this.leaving.set(false);
        }
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to leave batch');
        this.leaving.set(false);
      }
    });
  }

  protected joinHub(): void {
    const qty = this.joinQty();
    if (qty <= 0) return;

    this.joining.set(true);
    this.batchesService.joinBatch(this.batchId, qty).subscribe({
      next: (res) => {
        if (res.success) {
          if (res.clientSecret) {
            this.clientSecret.set(res.clientSecret);
            this.joining.set(false);
            setTimeout(() => {
              this.initStripe();
              this.cardElement.mount('#card-element');
            }, 0);
          } else {
            this.joining.set(false);
            this.joinModalOpen.set(false);
            this.toast.success('Joined hub!', `You've committed ${qty} units. A payment hold has been placed.`);
            this.loadBatch();
          }
        } else {
          this.joining.set(false);
          this.toast.error('Could not join', res.error || 'An error occurred');
        }
      },
      error: (err) => {
        this.joining.set(false);
        this.toast.error('Error', err?.error?.detail || err?.error?.title || 'Failed to join batch');
      }
    });
  }

  private initStripe() {
    if (this.stripe) return;
    this.stripe = (window as any).Stripe('pk_test_51Tk8ptBjYscPhZ5LBYxqyxlHzLHiL1bhZ7OUGNhdFHJbhUkPC6vA8bxbpp5Gf0HCasOkkqVvCF7KOxP1gBY7mKY100JaqmlKa4');
    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Inter", sans-serif',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });
  }

  protected confirmPayment(): void {
    if (!this.stripe || !this.cardElement || !this.clientSecret()) return;
    this.joining.set(true);

    this.stripe.confirmCardPayment(this.clientSecret(), {
      payment_method: { card: this.cardElement }
    }).then((result: any) => {
      if (result.error) {
        this.joining.set(false);
        this.toast.error('Card verification failed', result.error.message);
        const cardErrors = document.getElementById('card-errors');
        if (cardErrors) cardErrors.textContent = result.error.message;
      } else {
        if (result.paymentIntent.status === 'requires_capture') {
          this.batchesService.confirmJoinBatch(this.batchId, result.paymentIntent.id, this.joinQty()).subscribe({
            next: (confirmRes) => {
              this.joining.set(false);
              this.toast.success('Joined hub!', `You've committed ${this.joinQty()} units. Payment hold authorized and joined successfully.`);
              this.joinModalOpen.set(false);
              this.clientSecret.set(null);
              this.loadBatch();
            },
            error: (err) => {
              this.joining.set(false);
              this.toast.error('Verification Error', err?.error?.detail || 'Failed to complete registration');
            }
          });
        } else {
          this.joining.set(false);
          this.toast.error('Payment Error', 'Payment status is unexpected: ' + result.paymentIntent.status);
        }
      }
    }).catch((err: any) => {
      this.joining.set(false);
      this.toast.error('Error', err?.message || 'Payment confirmation failed');
    });
  }

  protected closeJoinModal(): void {
    this.joinModalOpen.set(false);
    this.clientSecret.set(null);
    this.cardElement = null;
  }

  protected onJoinQtyChange(e: Event): void {
    this.joinQty.set(+((e.target as HTMLInputElement).value));
  }

  protected openUpdateQtyModal(): void {
    const userId = this.authService.user()?.id;
    const participant = this.batch()?.participants.find(p => p.buyerId === userId);
    if (participant) {
      this.updateQty.set(participant.quantity);
      this.updateQtyModalOpen.set(true);
    }
  }

  protected submitUpdateQty(): void {
    const newQty = this.updateQty();
    if (newQty <= 0) return;
    this.updatingQty.set(true);
    this.batchesService.updateBatchParticipantQuantity(this.batchId, newQty).subscribe({
      next: (res) => {
        this.updatingQty.set(false);
        this.updateQtyModalOpen.set(false);
        this.toast.success('Quantity updated!', `Your committed quantity is now ${newQty} units. Your payment hold has been cycled.`);
        this.loadBatch();
      },
      error: (err) => {
        this.updatingQty.set(false);
        this.toast.error('Error', err?.error?.detail || err?.error?.title || 'Failed to update quantity');
      }
    });
  }

  protected onUpdateQtyChange(e: Event): void {
    this.updateQty.set(+((e.target as HTMLInputElement).value));
  }
}
