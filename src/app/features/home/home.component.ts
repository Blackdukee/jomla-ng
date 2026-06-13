import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <!-- Hero -->
      <section class="hero-section">
        <div class="container hero-inner">
          <div class="hero-left">
            <div class="eyebrow-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              Wholesale prices, unlocked together
            </div>

            <h1 class="hero-headline">
              Buy in groups.<br>
              <span class="text-brand">Pay wholesale.</span>
            </h1>

            <p class="hero-sub">
              Jomla pools B2B demand so you can unlock supplier volume discounts. Join an active deal or post a request and let suppliers compete.
            </p>

            <div class="hero-ctas">
              <a routerLink="/register/buyer" class="btn btn-primary btn-xl">Start buying →</a>
              <a routerLink="/register/supplier" class="btn btn-outline btn-xl">Sell on Jomla</a>
            </div>

            <div class="hero-stats" role="list">
              <div class="stat-item" role="listitem">
                <span class="stat-num">12k+</span>
                <span class="stat-label">Active buyers</span>
              </div>
              <div class="stat-divider" aria-hidden="true"></div>
              <div class="stat-item" role="listitem">
                <span class="stat-num">35%</span>
                <span class="stat-label">Avg. savings</span>
              </div>
              <div class="stat-divider" aria-hidden="true"></div>
              <div class="stat-item" role="listitem">
                <span class="stat-num">2.4k</span>
                <span class="stat-label">Deals closed</span>
              </div>
            </div>
          </div>

          <!-- Hero card mockup -->
          <div class="hero-right" aria-label="Live group deal example" role="img">
            <div class="hero-glow" aria-hidden="true"></div>
            <div class="card hero-card">
              <div class="hero-card-header">
                <span class="badge badge-muted">Group deal</span>
                <span class="badge badge-brand">-35%</span>
              </div>
              <h3 class="hero-card-title">Premium Wireless Headphones</h3>
              <div class="hero-card-price">
                <span class="hero-price">EGP 83.85</span>
                <span class="hero-price-orig">EGP 129.00</span>
              </div>

              <div class="hero-card-body">
                <div class="progress-labels">
                  <span class="text-brand" style="font-weight:600;font-size:0.875rem">38 of 50 units committed</span>
                  <span style="color:var(--text-secondary);font-size:0.875rem">76%</span>
                </div>
                <div class="progress-track" style="margin:0.5rem 0 1rem">
                  <div class="progress-fill" style="width:76%"></div>
                </div>
                <div class="hero-card-footer">
                  <div style="display:flex;align-items:center;gap:0.5rem;color:var(--text-secondary);font-size:0.875rem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    31 buyers in this hub
                  </div>
                  <span style="font-weight:600;font-size:0.875rem">12 more to unlock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="how-section" aria-labelledby="how-heading">
        <div class="container">
          <div class="section-header">
            <h2 id="how-heading" class="section-title">How Jomla works</h2>
            <p class="section-sub">Two sides, one marketplace. Pick your role to see the flow.</p>
          </div>

          <div class="tab-toggle" role="tablist" aria-label="How it works tabs">
            <button
              role="tab"
              [class]="howTab() === 'buyers' ? 'tab-btn active' : 'tab-btn'"
              [attr.aria-selected]="howTab() === 'buyers'"
              (click)="howTab.set('buyers')"
              id="tab-buyers"
              aria-controls="panel-buyers"
            >For Buyers</button>
            <button
              role="tab"
              [class]="howTab() === 'suppliers' ? 'tab-btn active' : 'tab-btn'"
              [attr.aria-selected]="howTab() === 'suppliers'"
              (click)="howTab.set('suppliers')"
              id="tab-suppliers"
              aria-controls="panel-suppliers"
            >For Suppliers</button>
          </div>

          @if (howTab() === 'buyers') {
            <div id="panel-buyers" role="tabpanel" aria-labelledby="tab-buyers" class="steps-grid">
              @for (step of buyerSteps; track step.num) {
                <div class="card step-card">
                  <div class="step-num" aria-hidden="true">{{ step.num }}</div>
                  <h3 class="step-title">{{ step.title }}</h3>
                  <p class="step-desc">{{ step.desc }}</p>
                </div>
              }
            </div>
          }
          @if (howTab() === 'suppliers') {
            <div id="panel-suppliers" role="tabpanel" aria-labelledby="tab-suppliers" class="steps-grid">
              @for (step of supplierSteps; track step.num) {
                <div class="card step-card">
                  <div class="step-num" aria-hidden="true">{{ step.num }}</div>
                  <h3 class="step-title">{{ step.title }}</h3>
                  <p class="step-desc">{{ step.desc }}</p>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Value props -->
      <section class="value-section" aria-labelledby="value-heading">
        <div class="container">
          <div class="section-header">
            <h2 id="value-heading" class="section-title">Why buyers and sellers choose Jomla</h2>
          </div>
          <div class="value-grid">
            @for (vp of valueProps; track vp.title) {
              <div class="card value-card">
                <div class="icon-container" style="margin-bottom:1rem" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path [attr.d]="vp.iconPath"/>
                    @if (vp.iconPath2) {
                      <path [attr.d]="vp.iconPath2"/>
                    }
                  </svg>
                </div>
                <h3 class="value-title">{{ vp.title }}</h3>
                <p class="value-desc">{{ vp.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section" aria-labelledby="cta-heading">
        <div class="container" style="text-align:center">
          <h2 id="cta-heading" class="cta-title">Ready to join the trading floor?</h2>
          <p class="cta-sub">
            Whether you're looking to save on inventory or move volume fast, Jomla is the marketplace for serious B2B trading.
          </p>
          <a routerLink="/register/buyer" class="btn btn-primary btn-xl">Create your account</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home { width: 100%; }

    /* Hero */
    .hero-section {
      padding: 5rem 0;
    }
    .hero-inner {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      align-items: center;
    }
    @media (min-width: 1024px) {
      .hero-inner { grid-template-columns: 1fr 1fr; }
    }
    .eyebrow-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(13,148,136,0.1);
      color: var(--brand);
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
    }
    .hero-headline {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.05;
      margin-bottom: 1.25rem;
    }
    .text-brand { color: var(--brand); }
    .hero-sub {
      font-size: 1.125rem;
      color: var(--text-secondary);
      line-height: 1.7;
      margin-bottom: 2rem;
      max-width: 500px;
    }
    .hero-ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .hero-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    .stat-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .stat-num { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
    .stat-label { font-size: 0.8125rem; color: var(--text-secondary); }
    .stat-divider { width: 1px; height: 2rem; background: var(--border); }

    /* Hero card */
    .hero-right { position: relative; }
    .hero-glow {
      position: absolute;
      inset: -10%;
      background: rgba(13,148,136,0.15);
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: -1;
    }
    .hero-card { overflow: hidden; transition: transform 0.4s ease; }
    .hero-card:hover { transform: translateY(-8px); }
    .hero-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 1.5rem 0;
      margin-bottom: 1rem;
    }
    .hero-card-title {
      font-size: 1.5rem;
      font-weight: 700;
      padding: 0 1.5rem;
      margin-bottom: 0.75rem;
    }
    .hero-card-price {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      padding: 0 1.5rem 1.5rem;
    }
    .hero-price { font-size: 2rem; font-weight: 800; }
    .hero-price-orig { color: var(--text-secondary); text-decoration: line-through; }
    .hero-card-body {
      background: rgba(204,251,241,0.3);
      border-top: 1px solid var(--border);
      padding: 1.5rem;
    }
    .progress-labels { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .hero-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
    }

    /* How it works */
    .how-section {
      padding: 5rem 0;
      background: #fff;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .section-header { text-align: center; margin-bottom: 2.5rem; }
    .section-title { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; margin-bottom: 0.75rem; }
    .section-sub { font-size: 1.0625rem; color: var(--text-secondary); }

    .tab-toggle {
      display: flex;
      justify-content: center;
      gap: 0;
      margin-bottom: 2.5rem;
      border-radius: 9999px;
      border: 1.5px solid var(--brand);
      overflow: hidden;
      width: fit-content;
      margin-left: auto;
      margin-right: auto;
    }
    .tab-btn {
      border: none;
      background: transparent;
      color: var(--brand);
      padding: 0.625rem 1.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn.active { background: var(--brand); color: #fff; }
    .tab-btn:hover:not(.active) { background: var(--brand-light); }

    .steps-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 768px) { .steps-grid { grid-template-columns: repeat(3, 1fr); } }

    .step-card { padding: 1.75rem; }
    .step-num {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: var(--brand-light);
      color: var(--brand);
      font-weight: 800;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .step-title { font-size: 1.0625rem; font-weight: 700; margin-bottom: 0.5rem; }
    .step-desc { font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.6; }

    /* Value props */
    .value-section { padding: 5rem 0; }
    .value-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    @media (min-width: 768px) { .value-grid { grid-template-columns: repeat(3, 1fr); } }
    .value-card { padding: 2rem; }
    .value-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.75rem; }
    .value-desc { color: var(--text-secondary); line-height: 1.7; }

    /* CTA */
    .cta-section { padding: 6rem 0; }
    .cta-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 1rem; }
    .cta-sub {
      font-size: 1.125rem;
      color: var(--text-secondary);
      max-width: 560px;
      margin: 0 auto 2.5rem;
      line-height: 1.7;
    }
  `],
})
export class HomeComponent {
  protected howTab = signal<'buyers' | 'suppliers'>('buyers');

  protected buyerSteps = [
    { num: '1', title: 'Join a hub', desc: 'Find a group deal that matches your need, or create a request to signal demand.' },
    { num: '2', title: 'Pool your demand', desc: 'Others join the hub. As quantity grows, the deal gets closer to unlocking.' },
    { num: '3', title: 'Pay wholesale', desc: 'Batch fills, deal locks in. You receive the goods at the agreed wholesale price.' },
  ];

  protected supplierSteps = [
    { num: '1', title: 'Post or respond', desc: 'List a group deal with a target quantity, or browse buyer demand and place a competing offer.' },
    { num: '2', title: 'Let AI negotiate', desc: 'Set a max discount and our agent adjusts your offer to win the batch within your limits.' },
    { num: '3', title: 'Fulfill the batch', desc: 'Once enough buyers commit, the batch closes and you ship a confirmed bulk order.' },
  ];

  protected valueProps = [
    {
      title: 'Group deals',
      desc: 'Pool your order with other buyers to hit wholesale quantities no single person could reach alone.',
      iconPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
      iconPath2: 'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    },
    {
      title: 'Sellers compete for you',
      desc: 'Post your demand and watch suppliers bid against each other to win your group\'s business.',
      iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      iconPath2: undefined,
    },
    {
      title: 'AI-powered negotiation',
      desc: 'Our agent negotiates discounts on your behalf within seller-set limits — better prices, hands-free.',
      iconPath: 'M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7 21h10M12 21v-4',
      iconPath2: undefined,
    },
  ];
}
