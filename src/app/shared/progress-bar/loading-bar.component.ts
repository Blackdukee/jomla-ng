import { Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  template: `
    @if (loadingService.isLoading()) {
      <div class="global-loading-bar" role="progressbar" aria-label="Loading page data">
        <div class="bar-fill"></div>
      </div>
    }
  `,
  styles: [`
    .global-loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 99999;
      background-color: rgba(13, 148, 136, 0.1);
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background-color: var(--brand);
      animation: loading-bar-sweep 1.5s infinite linear;
      transform-origin: 0% 50%;
    }
    @keyframes loading-bar-sweep {
      0% { transform: translateX(-100%) scaleX(0.2); }
      50% { transform: translateX(0%) scaleX(0.5); }
      100% { transform: translateX(100%) scaleX(0.2); }
    }
  `]
})
export class LoadingBarComponent {
  protected loadingService = inject(LoadingService);
}
