import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('footerEntrance', [
      transition(':enter', [
        query('.footer-col, .footer-brand', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger('40ms', [
            animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <footer class="footer" @footerEntrance [attr.dir]="isRtl() ? 'rtl' : 'ltr'">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="logo-container">
            <div class="footer-logo-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
            </div>
            <span class="logo-text">Jomla</span>
          </div>
          <p class="tagline">{{ t().tagline }}</p>
          <p class="footer-desc">{{ t().description }}</p>
          
          <div class="footer-socials">
            <a href="https://linkedin.com" target="_blank" class="social-icon" aria-label="LinkedIn">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" class="social-icon" aria-label="Twitter/X">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://wa.me/201034743315" target="_blank" class="social-icon" aria-label="WhatsApp">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.45 5.548 0 10.063-4.515 10.066-10.068.002-2.69-1.045-5.216-2.946-7.12C16.68 1.516 14.156.472 11.47.472 5.922.472 1.407 4.987 1.404 10.54c-.001 1.7.447 3.356 1.303 4.834l-.986 3.606 3.69-.974-.354.218z"/></svg>
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">{{ t().platform }}</h4>
          <a routerLink="/discover" class="footer-link">{{ t().browseDeals }}</a>
          <a routerLink="/my-hubs" class="footer-link">{{ t().myOrders }}</a>
          <a routerLink="/discover" class="footer-link">{{ t().groupBuys }}</a>
          <a routerLink="/register/supplier" class="footer-link">{{ t().becomeSupplier }}</a>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">{{ t().support }}</h4>
          <a routerLink="/" class="footer-link">{{ t().helpCenter }}</a>
          <a routerLink="/" class="footer-link">{{ t().contactUs }}</a>
          <a routerLink="/" class="footer-link">{{ t().terms }}</a>
          <a routerLink="/" class="footer-link">{{ t().privacy }}</a>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">{{ t().contactCTA }}</h4>
          <div class="contact-item">
            <span class="contact-label">Email</span>
            <a href="mailto:info@jomla.test" class="contact-value">info@jomla.test</a>
          </div>
          <div class="contact-item" style="margin-bottom:0.5rem">
            <span class="contact-label">WhatsApp</span>
            <a href="https://wa.me/201034743315" target="_blank" class="contact-value">+20 103 474 3315</a>
          </div>
          <a routerLink="/register/supplier" class="btn btn-outline footer-cta-btn">
            {{ t().joinSupplier }}
          </a>
        </div>
      </div>

      <div class="footer-bottom-wrapper">
        <div class="container footer-bottom">
          <p class="copyright">{{ t().copyright }}</p>
          <div class="footer-bottom-actions">
            <button class="lang-toggle-btn" (click)="toggleLang()" [attr.aria-label]="'Switch language'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-inline-end:0.375rem">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {{ t().toggleLabel }}
            </button>
            <span class="status-badge">
              <span class="status-dot"></span>
              {{ t().operational }}
            </span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #0F172A;
      color: #f8fafc;
      padding: 4rem 0 0;
      margin-top: auto;
      border-top: 1px solid rgba(59, 130, 246, 0.15);
      font-family: inherit;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      padding-bottom: 3.5rem;
    }
    @media (min-width: 640px) {
      .footer-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1024px) {
      .footer-grid { grid-template-columns: 1.5fr 1fr 1fr 1fr; }
    }
    .footer-brand {
      display: flex;
      flex-direction: column;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .footer-logo-icon {
      background: linear-gradient(135deg, var(--brand) 0%, #2563eb 100%);
      color: #fff;
      padding: 0.45rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
    }
    .logo-text {
      font-weight: 900;
      font-size: 1.5rem;
      letter-spacing: -0.03em;
      background: linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .tagline {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--brand);
      margin-bottom: 0.75rem;
      letter-spacing: 0.02em;
    }
    .footer-desc {
      font-size: 0.875rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }
    .footer-socials {
      display: flex;
      gap: 0.75rem;
    }
    .social-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.02);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
    }
    .social-icon:hover {
      background: var(--brand);
      color: #fff;
      border-color: var(--brand);
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    .footer-heading {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 1.25rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .footer-link {
      font-size: 0.875rem;
      color: #cbd5e1;
      text-decoration: none;
      transition: color 150ms ease;
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
      background-color: var(--brand);
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 150ms ease;
    }
    .footer-link:hover {
      color: var(--brand);
    }
    .footer-link:hover::after {
      transform: scaleX(1);
      transform-origin: left;
    }
    .footer[dir="rtl"] .footer-link::after {
      left: auto;
      right: 0;
      transform-origin: left;
    }
    .footer[dir="rtl"] .footer-link:hover::after {
      transform: scaleX(1);
      transform-origin: right;
    }
    .contact-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .contact-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .contact-value {
      font-size: 0.875rem;
      color: #cbd5e1;
      text-decoration: none;
      transition: color 150ms ease;
    }
    .contact-value:hover {
      color: var(--brand);
    }
    .footer-cta-btn {
      align-self: flex-start;
      margin-top: 0.5rem;
      border-color: rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      font-size: 0.875rem;
      padding: 0.5rem 1.25rem;
      height: auto;
      transition: all 0.2s ease;
    }
    .footer-cta-btn:hover {
      background: var(--brand);
      color: #fff;
      border-color: var(--brand);
      transform: translateY(-2px);
    }
    .footer-bottom-wrapper {
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      background: rgba(0, 0, 0, 0.15);
      padding: 1.5rem 0;
    }
    .footer-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      text-align: center;
    }
    @media (min-width: 768px) {
      .footer-bottom {
        flex-direction: row;
        text-align: start;
      }
    }
    .copyright {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
    }
    .footer-bottom-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .lang-toggle-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 150ms ease;
    }
    .lang-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.15);
    }
    .status-badge {
      font-size: 0.8125rem;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      background-color: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
  `]
})
export class FooterComponent {
  private languageService = inject(LanguageService);
  protected year = new Date().getFullYear();

  protected isRtl() {
    return this.languageService.currentLang() === 'ar';
  }

  protected toggleLang() {
    this.languageService.toggleLanguage();
  }

  private langMap = {
    en: {
      tagline: 'B2B Group Purchasing Platform',
      description: 'Pool demand to unlock wholesale prices. The high-stakes B2B platform for volume discounts and collaborative purchasing power.',
      platform: 'Platform',
      support: 'Support',
      contactCTA: 'Contact & CTA',
      browseDeals: 'Browse Deals',
      myOrders: 'My Orders',
      groupBuys: 'Group Buys',
      becomeSupplier: 'Become a Supplier',
      helpCenter: 'Help Center',
      contactUs: 'Contact Us',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      joinSupplier: 'Join as Supplier',
      copyright: '© 2026 Jomla. All rights reserved.',
      operational: 'System operational',
      toggleLabel: 'EN / AR'
    },
    ar: {
      tagline: 'منصة الشراء الجماعي B2B',
      description: 'تجميع الطلب لفتح أسعار الجملة. المنصة الرائدة للحصول على خصومات الحجم والقوة الشرائية المشتركة.',
      platform: 'المنصة',
      support: 'الدعم والمساعدة',
      contactCTA: 'الاتصال والتواصل',
      browseDeals: 'تصفح الصفقات',
      myOrders: 'طلباتي',
      groupBuys: 'الشراء الجماعي',
      becomeSupplier: 'كن مزوداً/مورداً',
      helpCenter: 'مركز المساعدة',
      contactUs: 'اتصل بنا',
      terms: 'شروط الخدمة',
      privacy: 'سياسة الخصوصية',
      joinSupplier: 'انضم كمورد',
      copyright: '© 2026 جملة. جميع الحقوق محفوظة.',
      operational: 'النظام يعمل بكفاءة',
      toggleLabel: 'AR / EN'
    }
  };

  protected t = computed(() => this.langMap[this.languageService.currentLang()]);
}
