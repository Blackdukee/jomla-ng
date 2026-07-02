import { Component, ChangeDetectionStrategy, inject, signal, HostListener, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { SignalRService } from '../../core/services/signalr.service';
import { NotificationDto } from '../../core/models';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="navbar" [class.scrolled]="isScrolled()">
      <div class="container navbar-inner">
        <!-- Logo -->
        <a [routerLink]="logoLink()" class="navbar-logo" aria-label="Jomla home">
          <div class="logo-icon" aria-hidden="true">
            <img src="icons/jomla-icon-grouping.svg" alt="Jomla Logo" />
          </div>
          <span class="logo-text">Jomla</span>
        </a>

        <!-- Authenticated Nav Links -->
        @if (auth.isAuthenticated()) {
          <nav class="navbar-links hide-mobile" aria-label="Main navigation">
            @for (link of navLinks(); track link.href) {
              <a [routerLink]="link.href" routerLinkActive="active" class="nav-link">
                {{ link.label }}
              </a>
            }
          </nav>
        }

        <!-- Right side actions -->
        <div class="navbar-actions">
          @if (!auth.isAuthenticated()) {
            <!-- Unauthenticated -->
            <div class="hide-mobile" style="display:flex;align-items:center;gap:1rem">
              <a routerLink="/login" class="btn-ghost btn btn-sm">Log in</a>
              <a routerLink="/register/buyer" class="btn btn-outline btn-sm">Join as buyer</a>
              <a routerLink="/register/supplier" class="btn btn-primary btn-sm">Join as supplier</a>
            </div>
            <!-- Mobile hamburger -->
            <button class="btn-icon btn hide-desktop" (click)="mobileOpen.set(!mobileOpen())" aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          } @else {
            <!-- Bell -->
            <div class="relative" style="position:relative">
              <button class="btn-icon btn" aria-label="Notifications" (click)="notifOpen.set(!notifOpen())">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                @if (unreadCount() > 0) {
                  <span class="bell-dot" aria-hidden="true"></span>
                }
              </button>
              @if (notifOpen()) {
                <div class="dropdown notif-panel" role="dialog" aria-label="Notifications">
                  <div class="dropdown-header">
                    <span style="font-weight:600">Notifications ({{ unreadCount() }})</span>
                    @if (unreadCount() > 0) {
                      <button class="btn-ghost btn btn-sm" style="font-size:0.75rem;height:auto;padding:0.25rem 0.5rem" (click)="markAllRead()">Mark all read</button>
                    }
                  </div>
                  <div style="max-height:360px;overflow-y:auto">
                    @if (notifications().length === 0) {
                      <div style="padding:2rem;text-align:center;color:var(--text-secondary);font-size:0.875rem">
                        No notifications yet.
                      </div>
                    } @else {
                      @for (notif of notifications(); track notif.id) {
                        <div class="notif-item" [class.unread]="!notif.isRead" (click)="markAsRead(notif)">
                          @if (!notif.isRead) {
                            <div class="notif-dot" aria-hidden="true"></div>
                          }
                          <div>
                            <div style="font-weight:600;font-size:0.875rem">{{ notif.title }}</div>
                            <div style="font-size:0.8rem;color:var(--text-secondary)">{{ notif.body }}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">{{ getRelativeTime(notif.createdAt) }}</div>
                          </div>
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Avatar dropdown -->
            <div style="position:relative">
            <button class="avatar" (click)="avatarOpen.set(!avatarOpen())" [attr.aria-label]="'User menu for ' + userDisplayName()">
            @if (auth.user()?.imageUrl) {
              <img [src]="auth.user()!.imageUrl" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover">
            } @else {
              {{ initials() }}
            }
            </button>
              @if (avatarOpen()) {
                <div class="dropdown avatar-menu" role="menu">
                  <div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border)">
                    <div style="font-weight:600;font-size:0.875rem">{{ userDisplayName() }}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary)">{{ auth.user()?.email }}</div>
                  </div>
                  <a routerLink="/profile" class="dropdown-item" role="menuitem" (click)="avatarOpen.set(false)">Profile</a>
                  <a routerLink="/settings" class="dropdown-item" role="menuitem" (click)="avatarOpen.set(false)">Settings</a>
                  <div style="height:1px;background:var(--border);margin:0.25rem 0"></div>
                  <button class="dropdown-item danger" role="menuitem" (click)="logout()">Log out</button>
                </div>
              }
            </div>

            <!-- Mobile hamburger (authenticated) -->
            <button class="btn-icon btn hide-desktop" (click)="mobileOpen.set(!mobileOpen())" aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          }
        </div>
      </div>

      <!-- Mobile menu drawer -->
      @if (mobileOpen()) {
        <div class="mobile-drawer" role="navigation" aria-label="Mobile navigation">
          @if (!auth.isAuthenticated()) {
            <a routerLink="/login" class="mobile-link" (click)="mobileOpen.set(false)">Log in</a>
            <a routerLink="/register/buyer" class="mobile-link" (click)="mobileOpen.set(false)">Join as buyer</a>
            <a routerLink="/register/supplier" class="mobile-link btn btn-primary" (click)="mobileOpen.set(false)">Join as supplier</a>
          } @else {
            @for (link of navLinks(); track link.href) {
              <a [routerLink]="link.href" class="mobile-link" (click)="mobileOpen.set(false)">{{ link.label }}</a>
            }
          }
        </div>
      }
    </header>
  `,
  styles: [`
    /* impeccable-disable design-system-color */
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar {
      background: #0F172A;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      height: 64px;
      transition: background 0.3s var(--transition), backdrop-filter 0.3s var(--transition), border-color 0.3s var(--transition);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .navbar.scrolled {
      background: #0F172A;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom-color: rgba(255, 255, 255, 0.15);
    }
    .navbar-inner {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }
    .navbar-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      flex-shrink: 0;
    }
    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-icon img {
      width: 28px;
      height: 28px;
      object-fit: contain;
      border-radius: 6px;
      transition: transform 0.3s ease, filter 0.3s ease;
    }
    .navbar-logo:hover .logo-icon img {
      transform: scale(1.08) rotate(5deg);
      filter: drop-shadow(0 0 8px rgba(13, 148, 136, 0.6));
    }
    .logo-text {
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .navbar-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex: 1;
      margin-left: 1rem;
    }
    .nav-link {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #94a3b8;
      text-decoration: none;
      padding: 1.25rem 0;
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
    }
    .nav-link:hover { color: #ffffff; }
    .nav-link.active {
      color: var(--brand);
      border-bottom-color: var(--brand);
    }
    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }
    .bell-dot {
      position: absolute;
      top: 0.5rem;
      right: 0.625rem;
      width: 8px;
      height: 8px;
      background: var(--brand);
      border-radius: 50%;
    }
    .dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 0.5rem);
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--card-radius);
      box-shadow: var(--card-shadow-hover);
      z-index: 200;
      overflow: hidden;
      animation: dropIn 0.15s ease;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .notif-panel { width: 360px; }
    .avatar-menu { width: 220px; }
    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }
    .notif-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.15s;
    }
    .notif-item:hover { background: #f9fafb; }
    .notif-item.unread { background: rgba(13,148,136,0.04); }
    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--brand);
      flex-shrink: 0;
      margin-top: 4px;
    }
    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      text-align: left;
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      transition: background 0.15s;
    }
    .dropdown-item:hover { background: #f9fafb; }
    .dropdown-item.danger { color: var(--danger); }
    
    .btn-ghost {
      color: #cbd5e1;
    }
    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
    .btn-outline {
      border-color: rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.3);
      color: #ffffff;
    }
    .mobile-drawer {
      background: var(--bg-page);
      border-top: 1px solid var(--border);
      padding: 1rem 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .mobile-link {
      display: block;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      color: var(--text-primary);
      text-decoration: none;
      transition: background 0.15s;
    }
    .mobile-link:hover { background: rgba(0,0,0,0.05); }
  `],
})
export class NavbarComponent implements OnInit, OnDestroy {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private notificationsService = inject(NotificationsService);
  private signalRService = inject(SignalRService);

  protected mobileOpen = signal(false);
  protected notifOpen = signal(false);
  protected avatarOpen = signal(false);
  protected isScrolled = signal(false);

  protected notifications = signal<NotificationDto[]>([]);
  protected unreadCount = signal<number>(0);
  private notifUnsubscribe: (() => void) | null = null;

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadNotifications();
      } else {
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }

  ngOnInit() {
    this.notifUnsubscribe = this.signalRService.onNotification((notif) => {
      this.notifications.update(list => [notif, ...list]);
      this.unreadCount.update(count => count + 1);
      this.toast.success(notif.title, notif.body);
    });
  }

  ngOnDestroy() {
    if (this.notifUnsubscribe) {
      this.notifUnsubscribe();
    }
  }

  protected loadNotifications() {
    this.notificationsService.getNotifications(false, 1, 20).subscribe({
      next: (res) => {
        this.notifications.set(res.items);
        this.unreadCount.set(res.unreadCount);
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
      }
    });
  }

  protected markAllRead() {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
        this.toast.success('Success', 'All notifications marked as read.');
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to mark notifications as read.');
      }
    });
  }

  protected markAsRead(notif: NotificationDto) {
    if (notif.isRead) return;
    this.notificationsService.markAsRead(notif.id).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        this.unreadCount.update(count => Math.max(0, count - 1));
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
      }
    });
  }

  protected getRelativeTime(dateStr: string): string {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 10);
  }

  protected logoLink() {
    if (!this.auth.isAuthenticated()) return '/';
    return this.auth.isBuyer() ? '/discover' : '/supplier/requests';
  }

  protected navLinks() {
    if (this.auth.isBuyer()) {
      return [
        { href: '/discover', label: 'Discover' },
        { href: '/wishlist', label: 'Wishlist' },
        { href: '/my-hubs', label: 'My Hubs' },
      ];
    }
    if (this.auth.isSupplier()) {
      return [
        { href: '/supplier/requests', label: 'Browse Requests' },
        { href: '/supplier/offers', label: 'My Offers' },
        { href: '/supplier/deals', label: 'Deals' },
        { href: '/supplier/alerts', label: 'Alerts' },
      ];
    }
    return [];
  }

  protected userDisplayName(): string {
    const u = this.auth.user();
    if (!u) return '';
    // Support both old (full_name) and new (firstName/lastName) user models
    if ((u as any).full_name) return (u as any).full_name;
    return `${(u as any).firstName ?? ''} ${(u as any).lastName ?? ''}`.trim();
  }

  protected initials() {
    const name = this.userDisplayName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  protected logout() {
    this.auth.logout().subscribe({
      complete: () => {
        this.avatarOpen.set(false);
        this.router.navigate(['/']);
      },
      error: () => {
        this.avatarOpen.set(false);
        this.router.navigate(['/']);
      }
    });
  }
}

