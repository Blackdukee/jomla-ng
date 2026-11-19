import { Component, ChangeDetectionStrategy, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { ToastComponent } from './shared/toast/toast.component';
import { LoadingBarComponent } from './shared/progress-bar/loading-bar.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent, LoadingBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell">
      <app-loading-bar />
      <app-navbar />
      <main class="main-content">
        <router-outlet />
      </main>
      <app-toast />
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
    }
  `],
})
export class AppComponent {
  constructor() {
    afterNextRender(() => {
      void fetch(`${environment.apiUrl}/visitor-visits`, {
        method: 'POST',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        keepalive: true,
      }).catch(() => undefined);
    });
  }
}
