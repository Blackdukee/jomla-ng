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
          <div class="logo-container">
            <div class="footer-logo-icon" aria-hidden="true">
              <img src="icons/jomla-icon-grouping.svg" alt="Jomla Logo" width="32" height="32" loading="lazy" />
            </div>
            <span class="logo-text">Jomla</span>
          </div>
          <p class="tagline">B2B Group Purchasing Platform</p>
          <p class="footer-desc">Pool demand to unlock wholesale prices. The high-stakes B2B platform for volume discounts and collaborative purchasing power.</p>

          <div class="footer-socials">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="LinkedIn">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Twitter/X">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h2 class="footer-heading">Platform</h2>
          <a routerLink="/discover" class="footer-link">Browse Deals</a>
          <a routerLink="/my-hubs" class="footer-link">My Orders</a>
          <a routerLink="/discover" class="footer-link">Group Buys</a>
          <a routerLink="/register/supplier" class="footer-link">Become a Supplier</a>
        </div>

        <div class="footer-col">
          <h2 class="footer-heading">Support</h2>
          <a routerLink="/" class="footer-link">Help Center</a>
          <a routerLink="/" class="footer-link">Contact Us</a>
          <a routerLink="/" class="footer-link">Terms of Service</a>
          <a routerLink="/" class="footer-link">Privacy Policy</a>
        </div>

        <div class="footer-col">
          <h2 class="footer-heading">Contact &amp; CTA</h2>
          <div class="contact-item">
            <span class="contact-label">Email</span>
            <a href="mailto:info@jomla.test" class="contact-value">info@jomla.test</a>
          </div>
          <a routerLink="/register/supplier" class="btn btn-outline footer-cta-btn">
            Join as Supplier
          </a>
        </div>
      </div>

      <div class="footer-bottom-wrapper">
        <div class="container footer-bottom">
          <p class="copyright">© {{ year }} Jomla. All rights reserved.</p>
          <div class="footer-bottom-actions">
            <span class="status-badge">
              <span class="status-dot"></span>
              System operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* impeccable-disable design-system-color */
    .footer {
      background: #0F172A;
      color: #cbd5e1;
      padding: 1.75rem 0 0;
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-family: inherit;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      text-align: left;
      align-items: start;
      padding-bottom: 1.75rem;
    }
    @media (min-width: 768px) {
      .footer-grid {
        grid-template-columns: 1.2fr 0.8fr 0.8fr 1fr;
      }
    }
    .footer-brand {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }
    @media (min-width: 768px) {
      .footer-brand {
        width: auto;
        margin-bottom: 0;
        padding-inline-end: 1.5rem;
        border-inline-end: 1px solid rgba(255, 255, 255, 0.05);
      }
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.375rem;
    }
    .footer-logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-logo-icon img {
      width: 28px;
      height: 28px;
      object-fit: contain;
      border-radius: 6px;
    }
    .logo-text {
      font-weight: 800;
      font-size: 1.375rem;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .tagline {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--brand-on-dark);
      margin-bottom: 0.5rem;
      letter-spacing: 0.01em;
    }
    .footer-desc {
      font-size: 0.75rem;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 1rem;
      max-width: 280px;
      margin-inline: 0;
    }
    .footer-socials {
      display: flex;
      gap: 0.5rem;
    }
    .social-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.02);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .social-icon:hover {
      background: var(--brand);
      color: #fff;
      border-color: var(--brand);
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-hover);
    }
    .footer-heading {
      font-size: 0.875rem;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 0.75rem;
      text-transform: none;
      letter-spacing: normal;
    }
    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }
    @media (min-width: 768px) {
      .footer-col:not(:last-child) {
        padding-inline-end: 1rem;
        border-inline-end: 1px solid rgba(255, 255, 255, 0.05);
        width: 100%;
        height: 100%;
      }
    }
    .footer-link {
      font-size: 0.8125rem;
      color: #94a3b8;
      text-decoration: none;
      transition: all 150ms ease;
      display: inline-flex;
      align-items: center;
      position: relative;
      align-self: flex-start;
      padding-bottom: 2px;
    }
    .footer-link::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 1.5px;
      background-color: var(--brand-on-dark);
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 150ms ease;
    }
    .footer-link:hover {
      color: #ffffff;
    }
    .footer-link:hover::after {
      transform: scaleX(1);
      transform-origin: left;
    }
    .contact-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .contact-label {
      font-size: 0.75rem;
      text-transform: none;
      letter-spacing: normal;
      color: #94a3b8;
    }
    .contact-value {
      font-size: 0.8125rem;
      color: #cbd5e1;
      text-decoration: none;
      transition: color 150ms ease;
    }
    .contact-value:hover {
      color: var(--brand-on-dark);
    }
    .footer-cta-btn {
      align-self: flex-start;
      margin-top: 0.25rem;
      border-color: rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      font-size: 0.8125rem;
      padding: 0.375rem 1rem;
      height: auto;
      background: transparent;
      border-radius: var(--btn-radius, 9999px);
    }
    .footer-cta-btn:hover {
      background: var(--brand);
      color: #fff;
      border-color: var(--brand);
      transform: translateY(-1px);
    }
    .footer-bottom-wrapper {
      border-top: 1px solid rgba(255, 255, 255, 0.03);
      background: rgba(0, 0, 0, 0.1);
      padding: 1rem 0;
    }
    .footer-bottom {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }
    @media (min-width: 768px) {
      .footer-bottom {
        flex-direction: row;
        justify-content: space-between;
      }
    }
    .copyright {
      font-size: 0.75rem;
      color: #94a3b8;
      margin: 0;
    }
    .footer-bottom-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      justify-content: center;
    }
    .status-badge {
      font-size: 0.75rem;
      color: #94a3b8;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    .status-dot {
      width: 5px;
      height: 5px;
      background-color: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 6px var(--success);
    }
  `]
})
export class FooterComponent {
  protected year = new Date().getFullYear();
}
