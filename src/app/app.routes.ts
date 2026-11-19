import { Routes } from '@angular/router';
import { authGuard, buyerGuard, supplierGuard, guestGuard, adminGuard } from './core/guards';

const loadDiscover = () => import('./features/buyer/discover/discover.component').then(m => m.DiscoverComponent);

// On a direct visit, start downloading the view while Angular initializes the router.
if (typeof location !== 'undefined' && /^\/discover\/?$/.test(location.pathname)) {
  void loadDiscover().catch(() => { /* The router retries when it activates the route. */ });
}

export const routes: Routes = [
  {
    path: '',
    title: 'Jomla — Buy in groups. Pay wholesale.',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    title: 'Log In — Jomla',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    title: 'Reset Password — Jomla',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register/buyer',
    title: 'Register as Buyer — Jomla',
    loadComponent: () => import('./features/auth/register-buyer/register-buyer.component').then(m => m.RegisterBuyerComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register/supplier',
    title: 'Register as Supplier — Jomla',
    loadComponent: () => import('./features/auth/register-supplier/register-supplier.component').then(m => m.RegisterSupplierComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'profile',
    title: 'Profile — Jomla',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    title: 'Settings — Jomla',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
  },

  /* Buyer Routes */
  {
    path: 'discover',
    title: 'Discover Deals — Jomla',
    loadComponent: loadDiscover,
    canActivate: [buyerGuard],
  },
  {
    path: 'wishlist',
    title: 'My Wishlist — Jomla',
    loadComponent: () => import('./features/buyer/wishlist/wishlist.component').then(m => m.WishlistComponent),
    canActivate: [buyerGuard],
  },
  {
    path: 'my-hubs',
    title: 'My Hubs — Jomla',
    loadComponent: () => import('./features/buyer/my-hubs/my-hubs.component').then(m => m.MyHubsComponent),
    canActivate: [buyerGuard],
  },
  {
    path: 'hubs/supplier/:batchId',
    title: 'Group Deal Hub — Jomla',
    loadComponent: () => import('./features/buyer/supplier-hub/supplier-hub.component').then(m => m.SupplierHubComponent),
    canActivate: [buyerGuard],
  },
  {
    path: 'hubs/request/:requestId',
    title: 'Request Hub — Jomla',
    loadComponent: () => import('./features/buyer/request-hub/request-hub.component').then(m => m.RequestHubComponent),
    canActivate: [buyerGuard],
  },

  /* Supplier Routes */
  {
    path: 'supplier/requests',
    title: 'Browse Requests — Jomla',
    loadComponent: () => import('./features/supplier/requests/supplier-requests.component').then(m => m.SupplierRequestsComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/offers',
    title: 'My Offers — Jomla',
    loadComponent: () => import('./features/supplier/offers/supplier-offers.component').then(m => m.SupplierOffersComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/offers/new',
    title: 'New Offer — Jomla',
    loadComponent: () => import('./features/supplier/add-offer/add-offer.component').then(m => m.AddOfferComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/offers/:offerId',
    title: 'Offer Details — Jomla',
    loadComponent: () => import('./features/supplier/offer-detail/offer-detail.component').then(m => m.OfferDetailComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/deals',
    title: 'Completed Deals — Jomla',
    loadComponent: () => import('./features/supplier/deals/supplier-deals.component').then(m => m.SupplierDealsComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/alerts',
    title: 'Wishlist Alerts — Jomla',
    loadComponent: () => import('./features/supplier/alerts/supplier-alerts.component').then(m => m.SupplierAlertsComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'manage/offers/:offerId',
    title: 'Manage Offer — Jomla',
    loadComponent: () => import('./features/supplier/add-offer/add-offer.component').then(m => m.AddOfferComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'manage/requests/:requestId',
    title: 'Manage Request — Jomla',
    loadComponent: () => import('./features/supplier/manage-request/manage-request.component').then(m => m.ManageRequestComponent),
    canActivate: [supplierGuard],
  },

  {
    path: 'admin',
    title: 'Moderation Queue — Jomla',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [adminGuard],
  },

  { path: '**', redirectTo: '' },
];
