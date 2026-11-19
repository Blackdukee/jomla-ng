import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { BatchesService } from '../../../core/services/batches.service';
import { OffersService } from '../../../core/services/offers.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { BatchDetailDto, BatchParticipantDto, BatchUpdatedDto, OfferDto } from '../../../core/models';
import { differenceInHours } from 'date-fns';
import { formatCairoDateTime, parseUtcDate } from '../../../shared/utils/date-time.util';
import { environment } from '../../../../environments/environment';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { CloudinaryPipe } from '../../../shared/pipes/cloudinary.pipe';

@Component({
  selector: 'app-supplier-hub',
  standalone: true,
  imports: [DecimalPipe, CloudinaryPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-hub.component.html',
  styleUrl: './supplier-hub.component.css'
})
export class SupplierHubComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private batchesService = inject(BatchesService);
  private offersService = inject(OffersService);
  private signalRService = inject(SignalRService);
  protected authService = inject(AuthService);
  private toast = inject(ToastService);

  protected batch = signal<BatchDetailDto | null>(null);
  protected offer = signal<OfferDto | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected leaving = signal(false);
  protected joinModalOpen = signal(false);
  protected joinQty = signal(1);
  protected joining = signal(false);
  protected clientSecret = signal<string | null>(null);

  protected chosenAddressOption = signal<'default' | 'custom'>('default');
  protected customShippingAddress = signal<string>('');
  protected chosenPhoneOption = signal<'default' | 'custom'>('default');
  protected customPhoneNumber = signal<string>('');

  protected updateQtyModalOpen = signal(false);
  protected updateQty = signal(1);
  protected updatingQty = signal(false);

  private batchId = '';
  private unsubBatchUpdate: (() => void) | null = null;
  private routeSub: Subscription | null = null;
  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  protected cardError = signal<string>('');

  protected participantQuantity = computed(() => {
    const userId = this.authService.user()?.id;
    if (!userId) return 0;
    const p = this.batch()?.participants.find(part => part.buyerId === userId && part.status === 'Active');
    return p ? p.quantity : 0;
  });

  protected isParticipant = computed(() => {
    return this.participantQuantity() > 0;
  });

  protected isBatchCompletedOrFailed = computed(() => {
    const b = this.batch();
    if (!b) return false;
    return b.status === 'Completed' || b.status === 'Failed';
  });

  protected isBatchFull = computed(() => {
    const b = this.batch();
    if (!b) return false;
    return b.currentQuantity >= b.targetQuantity;
  });

  protected shouldLockActions = computed(() => {
    return this.isBatchCompletedOrFailed() || this.isBatchFull();
  });

  protected activeImgIndex = signal(0);
  protected showAllParticipants = signal(false);

  protected prevImage(e: Event): void {
    e.stopPropagation();
    const imgs = this.offer()?.images;
    if (imgs && imgs.length > 0) {
      this.activeImgIndex.update(idx => (idx - 1 + imgs.length) % imgs.length);
    }
  }

  protected nextImage(e: Event): void {
    e.stopPropagation();
    const imgs = this.offer()?.images;
    if (imgs && imgs.length > 0) {
      this.activeImgIndex.update(idx => (idx + 1) % imgs.length);
    }
  }

  protected setImgIndex(i: number): void {
    this.activeImgIndex.set(i);
  }

  protected visibleParticipants = computed(() => {
    const list = this.sortedParticipants();
    if (this.showAllParticipants() || list.length <= 10) {
      return list;
    }
    return list.slice(0, 10);
  });

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const newBatchId = params.get('batchId') ?? '';
      if (!newBatchId) {
        this.error.set('No batch ID provided');
        this.loading.set(false);
        return;
      }

      // Cleanup prior batch subscriptions/groups
      this.unsubBatchUpdate?.();
      const prevBatch = this.batch();
      if (prevBatch) {
        this.signalRService.leaveOfferGroup(prevBatch.offerId);
      }

      this.batchId = newBatchId;
      this.loading.set(true);
      this.loadBatch();

      // Subscribe to real-time batch updates for the new batch
      this.unsubBatchUpdate = this.signalRService.onBatchUpdate((update: BatchUpdatedDto) => {
        if (update.batchId === this.batchId) {
          // Refresh from server to get updated participant list
          this.loadBatch();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.unsubBatchUpdate?.();
    const b = this.batch();
    if (b) {
      this.signalRService.leaveOfferGroup(b.offerId);
    }
    this.destroyCardElement();
  }

  private destroyCardElement(): void {
    if (this.cardElement) {
      try {
        this.cardElement.unmount();
        this.cardElement.destroy();
      } catch {
        // Element may already be detached when modal @if closes
      }
      this.cardElement = null;
    }
  }

  protected navigateToActiveBatch(): void {
    const activeId = this.offer()?.activeBatchId;
    if (activeId) {
      this.router.navigate(['/hubs/supplier', activeId]);
    }
  }

  private loadBatch(): void {
    this.batchesService.getBatch(this.batchId).subscribe({
      next: (batch) => {
        this.batch.set(batch);
        this.loading.set(false);
        // Join SignalR group for this offer
        this.signalRService.joinOfferGroup(batch.offerId);

        // Fetch offer details to get image and description
        this.offersService.getOfferById(batch.offerId).subscribe({
          next: (offer) => {
            this.offer.set(offer);
          },
          error: (err) => {
            console.error('Failed to load offer details:', err);
          }
        });
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
    const expiry = parseUtcDate(b?.expiresAt);
    if (!expiry) return false;
    const h = differenceInHours(expiry, new Date());
    return h < 1 && h >= 0;
  }

  protected expiresFormatted(): string {
    const b = this.batch();
    if (!b?.expiresAt) return 'No expiry set';
    return formatCairoDateTime(b.expiresAt, false);
  }

  protected isCurrentUser(buyerId: string): boolean {
    return this.authService.user()?.id === buyerId;
  }

  protected sortedParticipants = computed(() => {
    const b = this.batch();
    if (!b) return [];
    const currentUserId = this.authService.user()?.id;
    const list = [...b.participants];
    return list.sort((a, b) => {
      if (a.buyerId === currentUserId) return -1;
      if (b.buyerId === currentUserId) return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  });

  protected subtotal = computed(() => {
    const b = this.batch();
    if (!b) return 0;
    return this.joinQty() * b.discountedPrice;
  });

  protected savings = computed(() => {
    const b = this.batch();
    if (!b) return 0;
    return this.joinQty() * (b.unitPrice - b.discountedPrice);
  });

  protected getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  protected getParticipantName(p: BatchParticipantDto): string {
    if (this.isCurrentUser(p.buyerId)) {
      return 'You (you)';
    }
    return p.buyerName;
  }

  protected getParticipantInitials(p: BatchParticipantDto): string {
    if (this.isCurrentUser(p.buyerId)) {
      return 'Y';
    }
    return this.getInitials(p.buyerName);
  }

  protected timeRemainingFormatted(): string {
    const b = this.batch();
    if (!b?.expiresAt) return 'No expiry set';
    if (b.status === 'Completed') return 'Completed';
    if (b.status === 'Failed') return 'Expired';
    const now = new Date();
    const expiry = parseUtcDate(b.expiresAt);
    if (!expiry) return 'No expiry set';
    const diffMinutes = Math.floor((expiry.getTime() - now.getTime()) / 60000);
    if (diffMinutes <= 0) return 'Expired';
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
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
        this.toast.errorApi('Error', err);
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
            this.cardError.set('');
            this.joining.set(false);
            setTimeout(async () => {
              if (!this.joinModalOpen() || !this.clientSecret()) return;
              const card = await this.initStripe();
              if (!card || !this.joinModalOpen() || !document.getElementById('card-element')) return;
              card.mount('#card-element');
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
        this.toast.errorApi('Error', err);
      }
    });
  }

  private async initStripe(): Promise<StripeCardElement | null> {
    if (!this.stripe) {
      this.stripe = await loadStripe(environment.stripePublishableKey);
    }
    if (!this.stripe) {
      this.toast.error('Payment Error', 'Payment provider failed to load. Please refresh and try again.');
      return null;
    }

    this.destroyCardElement();
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
    this.cardElement.on('change', (event) => {
      this.cardError.set(event.error?.message ?? '');
    });
    return this.cardElement;
  }

  protected confirmPayment(): void {
    const clientSecret = this.clientSecret();
    if (!this.stripe || !this.cardElement || !clientSecret || this.joining()) return;
    this.joining.set(true);
    this.cardError.set('');

    this.stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: this.cardElement }
    }).then((result) => {
      if (result.error) {
        this.joining.set(false);
        const msg = result.error.message ?? 'Card verification failed';
        this.cardError.set(msg);
        this.toast.error('Card verification failed', msg);
      } else if (result.paymentIntent?.status === 'requires_capture') {
        const finalAddress = this.chosenAddressOption() === 'default' 
          ? (this.authService.user()?.shippingAddress || '') 
          : this.customShippingAddress();
        const finalPhone = this.chosenPhoneOption() === 'default' 
          ? (this.authService.user()?.phoneNumber || '') 
          : this.customPhoneNumber();

        this.batchesService.confirmJoinBatch(
          this.batchId, 
          result.paymentIntent.id, 
          this.joinQty(),
          finalAddress,
          finalPhone
        ).subscribe({
          next: () => {
            this.joining.set(false);
            this.toast.success('Joined hub!', `You've committed ${this.joinQty()} units. Payment hold authorized and joined successfully.`);
            this.closeJoinModal();
            this.loadBatch();
          },
          error: (err) => {
            this.joining.set(false);
            this.toast.errorApi('Verification Error', err);
          }
        });
      } else {
        this.joining.set(false);
        this.toast.error('Payment Error', 'Payment status is unexpected: ' + (result.paymentIntent?.status ?? 'unknown'));
      }
    }).catch((err: unknown) => {
      this.joining.set(false);
      const message = err instanceof Error ? err.message : 'Payment confirmation failed';
      this.toast.error('Error', message);
    });
  }

  protected closeJoinModal(): void {
    this.joinModalOpen.set(false);
    this.clientSecret.set(null);
    this.destroyCardElement();
    this.cardError.set('');
    this.chosenAddressOption.set('default');
    this.customShippingAddress.set('');
    this.chosenPhoneOption.set('default');
    this.customPhoneNumber.set('');
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
        this.toast.errorApi('Error', err);
      }
    });
  }

  protected onUpdateQtyChange(e: Event): void {
    this.updateQty.set(+((e.target as HTMLInputElement).value));
  }
}
