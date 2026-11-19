import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard, buyerGuard, supplierGuard, adminGuard, guestGuard } from './guards';

describe('Route Guards', () => {
  const isAuthenticated = signal(false);
  const isBuyer = signal(false);
  const isSupplier = signal(false);
  const isAdmin = signal(false);

  let router: Router;
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  const setRole = (role: 'guest' | 'buyer' | 'supplier' | 'admin') => {
    isAuthenticated.set(role !== 'guest');
    isBuyer.set(role === 'buyer');
    isSupplier.set(role === 'supplier');
    isAdmin.set(role === 'admin');
  };

  const runGuard = (guard: typeof authGuard): boolean | string => {
    const result = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));
    if (result === true) return true;
    expect(result).toBeInstanceOf(UrlTree);
    return router.serializeUrl(result as UrlTree);
  };

  beforeEach(() => {
    setRole('guest');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: isAuthenticated.asReadonly(),
            isBuyer: isBuyer.asReadonly(),
            isSupplier: isSupplier.asReadonly(),
            isAdmin: isAdmin.asReadonly()
          }
        }
      ]
    });
    router = TestBed.inject(Router);
  });

  it('authGuard allows authenticated users and redirects guests to /login', () => {
    expect(runGuard(authGuard)).toBe('/login');
    setRole('buyer');
    expect(runGuard(authGuard)).toBe(true);
  });

  it('buyerGuard allows buyers and redirects guests, suppliers, and admins', () => {
    expect(runGuard(buyerGuard)).toBe('/login');
    setRole('buyer');
    expect(runGuard(buyerGuard)).toBe(true);
    setRole('supplier');
    expect(runGuard(buyerGuard)).toBe('/supplier/requests');
    setRole('admin');
    expect(runGuard(buyerGuard)).toBe('/admin');
  });

  it('supplierGuard allows suppliers and redirects guests, buyers, and admins', () => {
    expect(runGuard(supplierGuard)).toBe('/login');
    setRole('supplier');
    expect(runGuard(supplierGuard)).toBe(true);
    setRole('buyer');
    expect(runGuard(supplierGuard)).toBe('/discover');
    setRole('admin');
    expect(runGuard(supplierGuard)).toBe('/admin');
  });

  it('adminGuard allows admins and redirects guests and non-admin users', () => {
    expect(runGuard(adminGuard)).toBe('/login');
    setRole('admin');
    expect(runGuard(adminGuard)).toBe(true);
    setRole('buyer');
    expect(runGuard(adminGuard)).toBe('/');
    setRole('supplier');
    expect(runGuard(adminGuard)).toBe('/');
  });

  it('guestGuard allows guests and redirects authenticated users to role dashboards', () => {
    expect(runGuard(guestGuard)).toBe(true);
    setRole('buyer');
    expect(runGuard(guestGuard)).toBe('/discover');
    setRole('supplier');
    expect(runGuard(guestGuard)).toBe('/supplier/requests');
    setRole('admin');
    expect(runGuard(guestGuard)).toBe('/admin');
  });
});
