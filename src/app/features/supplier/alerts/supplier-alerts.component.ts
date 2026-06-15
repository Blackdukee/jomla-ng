import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_ALERTS, SupplierAlert } from '../../../core/mock-data';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-supplier-alerts',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-alerts.component.html',
  styleUrl: './supplier-alerts.component.css'
})
export class SupplierAlertsComponent {
  protected alerts: SupplierAlert[] = MOCK_ALERTS;
  protected relTime(d: string) { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
}
