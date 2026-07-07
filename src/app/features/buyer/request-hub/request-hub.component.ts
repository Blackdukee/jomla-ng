import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { GroupRequestOffersService } from '../../../core/services/group-request-offers.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { GroupRequestDetailDto, GroupRequestOfferDto } from '../../../core/models';
import { format } from 'date-fns';
import { environment } from '../../../../environments/environment';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-request-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-hub.component.html',
  styleUrl: './request-hub.component.css'
})
export class RequestHubComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  protected authService = inject(AuthService);
  private groupRequestsService = inject(GroupRequestsService);
  private groupRequestOffersService = inject(GroupRequestOffersService);
  private signalRService = inject(SignalRService);

  protected request = signal<GroupRequestDetailDto | null>(null);
  protected offers = signal<GroupRequestOfferDto[]>([]);
  protected joinQuantity = signal<number>(1);
  protected showJoinModal = signal<boolean>(false);
  
  protected showHistory = signal<boolean>(false);
  protected showAcceptModal = signal<boolean>(false);
  protected selectedOffer = signal<GroupRequestOfferDto | null>(null);
  protected acceptQuantity = signal<number>(1);
  protected clientSecret = signal<string | null>(null);
  protected authorizingPayment = signal<boolean>(false);
  protected submittingHold = signal<boolean>(false);

  protected chosenAddressOption = signal<'default' | 'custom'>('default');
  protected customShippingAddress = signal<string>('');
  protected chosenPhoneOption = signal<'default' | 'custom'>('default');
  protected customPhoneNumber = signal<string>('');

  private requestId = '';
  private unsubRequestUpdate: (() => void) | null = null;
  private stripe: any = null;
  private cardElement: any = null;

  protected isJoined = computed(() => {
    const req = this.request();
    const user = this.authService.user();
    if (!req || !user) return false;
    
    // Fallback to participantIds if participants array is missing
    if (req.participants) {
      return req.participants.some((p: any) => p.id === user.id);
    }
    return (req as any).participantIds?.includes(user.id) || false;
  });

  protected visibleOffers = computed(() => {
    const allOffers = [...this.offers()];
    const showHist = this.showHistory();

    return allOffers
      .filter(o => {
        if (showHist) return true;
        // Show Open offers, or Accepted offers ONLY if they are currently animating out
        return o.status === 'Open' || (o.status === 'Accepted' && o.isAnimatingOut);
      })
      .sort((a, b) => {
        // Sort Open offers to the top
        if (a.status === 'Open' && b.status !== 'Open') return -1;
        if (b.status === 'Open' && a.status !== 'Open') return 1;
        // Then sort by lowest price
        return a.currentUnitPrice - b.currentUnitPrice;
      });
  });

  protected hasAcceptedOffer(offer: GroupRequestOfferDto): boolean {
    const user = this.authService.user();
    if (!user || !offer.acceptedBuyerIds) return false;
    return offer.acceptedBuyerIds.includes(user.id);
  }

  protected hasRejectedOffer(offer: GroupRequestOfferDto): boolean {
    const user = this.authService.user();
    if (!user || !offer.rejectedBuyerIds) return false;
    return offer.rejectedBuyerIds.includes(user.id);
  }

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('requestId') ?? '';
    if (!this.requestId) {
      this.toast.error('Error', 'No request ID provided.');
      this.router.navigate(['/my-hubs']);
      return;
    }
    this.loadRequest();

    this.signalRService.joinGroupRequestGroup(this.requestId);
    this.unsubRequestUpdate = this.signalRService.onGroupRequestUpdate((update) => {
      if (update.id === this.requestId) {
        this.request.set(update);
        const currentOffers = this.offers();
        const newOffers = update.offers || [];
        
        // Find offers that just transitioned from Open to Accepted
        newOffers.forEach(no => {
          const old = currentOffers.find(o => o.id === no.id);
          if (old && old.status === 'Open' && no.status === 'Accepted') {
            no.isAnimatingOut = true;
            setTimeout(() => {
              this.offers.update(offers => {
                const off = offers.find(o => o.id === no.id);
                if (off) off.isAnimatingOut = false;
                return [...offers];
              });
            }, 400);
          }
        });
        
        this.offers.set(newOffers);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.requestId) {
      this.signalRService.leaveGroupRequestGroup(this.requestId);
    }
    this.unsubRequestUpdate?.();
    this.cardElement = null;
  }

  private loadRequest() {
    this.groupRequestsService.getGroupRequest(this.requestId).subscribe({
      next: (req) => {
        this.request.set(req);
        this.offers.set(req.offers || []);
      },
      error: (err) => {
        this.toast.errorApi('Error', err);
        this.router.navigate(['/my-hubs']);
      }
    });
  }

  protected fmtExpiry(d: string) {
    try {
      const adjusted = new Date(new Date(d).getTime() + 3 * 60 * 60 * 1000);
      return format(adjusted, "MMM d, ha 'UTC'");
    } catch {
      return '';
    }
  }

  protected accept(offer: GroupRequestOfferDto) {
    this.selectedOffer.set(offer);
    const remaining = offer.quantityAvailable - offer.acceptedQuantity;
    this.acceptQuantity.set(remaining);
    this.showAcceptModal.set(true);
  }

  protected closeAcceptModal(): void {
    this.showAcceptModal.set(false);
    this.selectedOffer.set(null);
    this.clientSecret.set(null);
    this.cardElement = null;
    this.chosenAddressOption.set('default');
    this.customShippingAddress.set('');
    this.chosenPhoneOption.set('default');
    this.customPhoneNumber.set('');
  }

  protected onAcceptQtyChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.acceptQuantity.set(parseInt(val, 10) || 1);
  }

  protected submitAcceptHold(): void {
    const offer = this.selectedOffer();
    if (!offer) return;

    const qty = this.acceptQuantity();
    const remaining = offer.quantityAvailable - offer.acceptedQuantity;
    if (qty <= 0 || qty > remaining) {
      this.toast.error('Invalid Quantity', `Please enter a quantity between 1 and ${remaining}.`);
      return;
    }

    this.submittingHold.set(true);
    this.groupRequestOffersService.acceptOffer(offer.id, qty).subscribe({
      next: (res) => {
        this.submittingHold.set(false);
        if (res.clientSecret) {
          this.clientSecret.set(res.clientSecret);
          setTimeout(async () => {
            await this.initStripe();
            this.cardElement.mount('#accept-card-element');
          }, 0);
        } else {
          this.toast.error('Error', 'No payment token received.');
        }
      },
      error: (err) => {
        this.submittingHold.set(false);
        this.toast.errorApi('Error', err);
      }
    });
  }

  private async initStripe() {
    if (this.stripe) return;
    this.stripe = await loadStripe(environment.stripePublishableKey);
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

  protected confirmHoldPayment(): void {
    const offer = this.selectedOffer();
    if (!this.stripe || !this.cardElement || !this.clientSecret() || !offer || this.authorizingPayment()) return;
    this.authorizingPayment.set(true);

    this.stripe.confirmCardPayment(this.clientSecret(), {
      payment_method: { card: this.cardElement }
    }).then((result: any) => {
      if (result.error) {
        this.authorizingPayment.set(false);
        this.toast.error('Card authorization failed', result.error.message);
        const cardErrors = document.getElementById('accept-card-errors');
        if (cardErrors) cardErrors.textContent = result.error.message;
      } else {
        if (result.paymentIntent.status === 'requires_capture') {
          const finalAddress = this.chosenAddressOption() === 'default' 
            ? (this.authService.user()?.shippingAddress || '') 
            : this.customShippingAddress();
          const finalPhone = this.chosenPhoneOption() === 'default' 
            ? (this.authService.user()?.phoneNumber || '') 
            : this.customPhoneNumber();

          this.groupRequestOffersService.confirmAcceptOffer(
            offer.id, 
            result.paymentIntent.id, 
            this.acceptQuantity(),
            finalAddress,
            finalPhone
          ).subscribe({
            next: () => {
              this.authorizingPayment.set(false);
              this.toast.success('Offer accepted!', `Successfully authorized hold and accepted the offer.`);
              this.closeAcceptModal();
              this.loadRequest();
            },
            error: (err) => {
              this.authorizingPayment.set(false);
              this.toast.errorApi('Confirmation Error', err);
            }
          });
        } else {
          this.authorizingPayment.set(false);
          this.toast.error('Payment Error', 'Payment status is unexpected: ' + result.paymentIntent.status);
        }
      }
    }).catch((err: any) => {
      this.authorizingPayment.set(false);
      this.toast.error('Error', err?.message || 'Payment confirmation failed');
    });
  }

  protected cancelAccept(offer: GroupRequestOfferDto) {
    this.groupRequestOffersService.leaveOffer(offer.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Left offer', 'You have successfully left this supplier offer.');
          this.loadRequest();
        } else {
          this.toast.error('Error', res.error || 'Failed to leave offer');
        }
      },
      error: (err) => {
        this.toast.errorApi('Error', err);
      }
    });
  }

  protected reject(offer: GroupRequestOfferDto) {
    this.groupRequestOffersService.rejectOffer(offer.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Rejected offer', 'You have successfully rejected this supplier offer.');
          this.loadRequest();
        } else {
          this.toast.error('Error', res.error || 'Failed to reject offer');
        }
      },
      error: (err) => {
        this.toast.errorApi('Error', err);
      }
    });
  }

  protected leaveRequest() {
    this.groupRequestsService.leaveGroupRequest(this.requestId).subscribe({
      next: () => {
        this.toast.success('Left hub', 'You have left this request.');
        this.router.navigate(['/my-hubs']);
      },
      error: (err) => {
        this.toast.errorApi('Error', err);
      }
    });
  }

  protected onQtyChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.joinQuantity.set(parseInt(val, 10) || 1);
  }

  protected joinRequest() {
    const qty = this.joinQuantity();
    if (qty <= 0) {
      this.toast.error('Invalid Quantity', 'Please enter a quantity of 1 or more.');
      return;
    }

    this.groupRequestsService.joinGroupRequest(this.requestId, qty).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Joined Hub!', 'You have successfully joined this group request.');
          this.showJoinModal.set(false);
          this.loadRequest();
        } else {
          this.toast.error('Error', res.error || 'Failed to join group request.');
        }
      },
      error: (err) => {
        this.toast.errorApi('Error', err);
      }
    });
  }
}
