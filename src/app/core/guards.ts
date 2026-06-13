import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const buyerGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  if (!auth.isBuyer()) { router.navigate(['/supplier/requests']); return false; }
  return true;
};

export const supplierGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  if (!auth.isSupplier()) { router.navigate(['/discover']); return false; }
  return true;
};

export const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    if (auth.isBuyer()) router.navigate(['/discover']);
    else router.navigate(['/supplier/requests']);
    return false;
  }
  return true;
};
