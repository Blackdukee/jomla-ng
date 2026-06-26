import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BuyerHub } from '../../../core/mock-data';

@Component({
  selector: 'app-my-hubs',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-hubs.component.html',
  styleUrl: './my-hubs.component.css'
})
export class MyHubsComponent {
  protected tab = signal<'active' | 'fulfilled'>('active');
  protected hubs = computed<BuyerHub[]>(() => []);

  protected hubLink(hub: BuyerHub) {
    return hub.type === 'supplier_offer' ? ['/hubs/supplier', hub.batch_id] : ['/hubs/request', hub.request_id];
  }

  protected fillPct(hub: BuyerHub) {
    if (!hub.fill_target || !hub.fill_progress) return 0;
    return Math.round((hub.fill_progress / hub.fill_target) * 100);
  }
}
