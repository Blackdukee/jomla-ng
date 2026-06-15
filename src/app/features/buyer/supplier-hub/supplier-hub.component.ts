import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MOCK_BATCH, Batch } from '../../../core/mock-data';
import { ToastService } from '../../../core/toast.service';
import { differenceInHours, format } from 'date-fns';

@Component({
  selector: 'app-supplier-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-hub.component.html',
  styleUrl: './supplier-hub.component.css'
})
export class SupplierHubComponent {
  protected router = inject(Router);
  private toast = inject(ToastService);

  protected batch = signal<Batch>({ ...MOCK_BATCH });
  protected leaving = signal(false);
  protected joinModalOpen = signal(false);
  protected joinQty = signal(1);
  protected joining = signal(false);

  protected progress() {
    const b = this.batch();
    return b.target_quantity > 0 ? Math.round((b.filled_quantity / b.target_quantity) * 100) : 0;
  }

  protected isExpiringSoon() {
    const h = differenceInHours(new Date(this.batch().expires_at), new Date());
    return h < 1 && h >= 0;
  }

  protected expiresFormatted() {
    return format(new Date(this.batch().expires_at), 'MMM d, h:mm a');
  }

  protected leave() {
    this.leaving.set(true);
    setTimeout(() => {
      this.toast.success('Left hub', 'You have left this group deal.');
      this.leaving.set(false);
      this.router.navigate(['/my-hubs']);
    }, 600);
  }

  protected joinHub() {
    this.joining.set(true);
    setTimeout(() => {
      this.joining.set(false);
      this.joinModalOpen.set(false);
      this.batch.update(b => ({
        ...b,
        filled_quantity: b.filled_quantity + this.joinQty(),
        current_user_participant: true,
        participants: [...b.participants, { id: 99, first_name: 'You', quantity: this.joinQty(), is_current_user: true }],
      }));
      this.toast.success('Joined hub!', `You've committed ${this.joinQty()} units.`);
    }, 700);
  }

  protected onJoinQtyChange(e: Event) {
    this.joinQty.set(+((e.target as HTMLInputElement).value));
  }
}
