import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const buyerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (auth.isAdmin()) return router.createUrlTree(['/admin']);
  if (!auth.isBuyer()) return router.createUrlTree(['/supplier/requests']);
  return true;
};

export const supplierGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (auth.isAdmin()) return router.createUrlTree(['/admin']);
  if (!auth.isSupplier()) return router.createUrlTree(['/discover']);
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!auth.isAdmin()) return router.createUrlTree(['/']);
  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    if (auth.isAdmin()) return router.createUrlTree(['/admin']);
    if (auth.isBuyer()) return router.createUrlTree(['/discover']);
    return router.createUrlTree(['/supplier/requests']);
  }
  return true;
};
