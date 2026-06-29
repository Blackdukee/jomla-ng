import { Component, signal, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  template: `
    <div class="app-shell" [class.ready]="isReady()">
      <app-navbar />
      <main class="main-content">
        <router-outlet />
      </main>
      <app-footer />
      <app-toast />
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      opacity: 0;
    }
    .app-shell.ready {
      opacity: 1;
    }
    .main-content {
      flex: 1;
    }
  `],
})
export class AppComponent {
  isReady = signal(false);

  constructor() {
    afterNextRender(() => {
      this.isReady.set(true);
    });
  }
}
