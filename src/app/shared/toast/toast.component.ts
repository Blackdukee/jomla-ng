import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { toastAnimation } from '../animations/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  animations: [toastAnimation],
  template: `
    <div class="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div @toastAnimation class="toast" [class]="'toast-' + toast.type" role="alert">
          <div style="flex:1">
            <div style="font-weight:600;font-size:0.875rem;margin-bottom:2px">{{ toast.title }}</div>
            @if (toast.description) {
              <div style="font-size:0.8rem;color:var(--text-secondary)">{{ toast.description }}</div>
            }
          </div>
          <button
            (click)="toastSvc.remove(toast.id)"
            style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:0;font-size:1.1rem;line-height:1"
            aria-label="Close notification"
          >✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  protected toastSvc = inject(ToastService);
}
