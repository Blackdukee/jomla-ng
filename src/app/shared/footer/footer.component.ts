import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <div class="footer-logo-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
            </div>
            <span style="font-weight:800;font-size:1.25rem;letter-spacing:-0.02em">Jomla</span>
          </div>
          <p class="footer-desc">Buy in groups. Pay wholesale. The high-stakes B2B platform for volume discounts.</p>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Buyers</h4>
          <a routerLink="/discover" class="footer-link">Discover Deals</a>
          <a routerLink="/wishlist" class="footer-link">Create Request</a>
          <a routerLink="/" class="footer-link">How Buying Works</a>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Suppliers</h4>
          <a routerLink="/register/supplier" class="footer-link">Become a Supplier</a>
          <a routerLink="/supplier/requests" class="footer-link">Browse Requests</a>
          <a routerLink="/" class="footer-link">How Selling Works</a>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Company</h4>
          <a routerLink="/" class="footer-link">About Us</a>
          <a routerLink="/" class="footer-link">Terms of Service</a>
          <a routerLink="/" class="footer-link">Privacy Policy</a>
        </div>
      </div>

      <div class="container footer-bottom">
        <p>&copy; {{ year }} Jomla. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--bg-dark);
      color: #fff;
      padding: 3rem 0 0;
      margin-top: auto;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media (min-width: 768px) {
      .footer-grid { grid-template-columns: 1.5fr 1fr 1fr 1fr; }
    }
    .footer-logo-icon {
      background: var(--brand);
      color: #fff;
      padding: 0.375rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-desc {
      font-size: 0.875rem;
      color: #9CA3AF;
      margin-top: 0.75rem;
      line-height: 1.6;
    }
    .footer-heading {
      font-size: 0.875rem;
      font-weight: 600;
      color: #E5E7EB;
      margin-bottom: 0.75rem;
    }
    .footer-col { display: flex; flex-direction: column; gap: 0.625rem; }
    .footer-link {
      font-size: 0.875rem;
      color: #9CA3AF;
      text-decoration: none;
      transition: color 0.15s;
    }
    .footer-link:hover { color: #fff; }
    .footer-bottom {
      margin-top: 3rem;
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
      border-top: 1px solid #1F2937;
      text-align: center;
      font-size: 0.875rem;
      color: #6B7280;
    }
  `],
})
export class FooterComponent {
  protected year = new Date().getFullYear();
}
