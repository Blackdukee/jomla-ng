import { Routes } from '@angular/router';
import { authGuard, buyerGuard, supplierGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register/buyer',
    loadComponent: () => import('./features/auth/register-buyer/register-buyer.component').then(m => m.RegisterBuyerComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register/supplier',
    loadComponent: () => import('./features/auth/register-supplier/register-supplier.component').then(m => m.RegisterSupplierComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
  },

  /* Buyer Routes */
  {
    path: 'discover',
    loadComponent: () => import('./features/buyer/discover/discover.component').then(m => m.DiscoverComponent),
    canActivate: [buyerGuard],
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./features/buyer/wishlist/wishlist.component').then(m => m.WishlistComponent),
    canActivate: [buyerGuard],
  },
  {
    path: 'my-hubs',
    loadComponent: () => import('./features/buyer/my-hubs/my-hubs.component').then(m => m.MyHubsComponent),
    canActivate: [buyerGuard],
  },
  {
    path: 'hubs/supplier/:batchId',
    loadComponent: () => import('./features/buyer/supplier-hub/supplier-hub.component').then(m => m.SupplierHubComponent),
    canActivate: [buyerGuard],
  },
  {
    path: 'hubs/request/:requestId',
    loadComponent: () => import('./features/buyer/request-hub/request-hub.component').then(m => m.RequestHubComponent),
    canActivate: [buyerGuard],
  },
  {
    path: 'payment/:responseId',
    loadComponent: () => import('./features/payment/payment.component').then(m => m.PaymentComponent),
    canActivate: [buyerGuard],
  },

  /* Supplier Routes */
  {
    path: 'supplier/requests',
    loadComponent: () => import('./features/supplier/requests/supplier-requests.component').then(m => m.SupplierRequestsComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/offers',
    loadComponent: () => import('./features/supplier/offers/supplier-offers.component').then(m => m.SupplierOffersComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/offers/new',
    loadComponent: () => import('./features/supplier/add-offer/add-offer.component').then(m => m.AddOfferComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/offers/:offerId',
    loadComponent: () => import('./features/supplier/offer-detail/offer-detail.component').then(m => m.OfferDetailComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/deals',
    loadComponent: () => import('./features/supplier/deals/supplier-deals.component').then(m => m.SupplierDealsComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'supplier/alerts',
    loadComponent: () => import('./features/supplier/alerts/supplier-alerts.component').then(m => m.SupplierAlertsComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'manage/offers/:offerId',
    loadComponent: () => import('./features/supplier/add-offer/add-offer.component').then(m => m.AddOfferComponent),
    canActivate: [supplierGuard],
  },
  {
    path: 'manage/requests/:requestId',
    loadComponent: () => import('./features/supplier/manage-request/manage-request.component').then(m => m.ManageRequestComponent),
    canActivate: [supplierGuard],
  },

  { path: '**', redirectTo: '' },
];
