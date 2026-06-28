import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px)' }),
    animate('500ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const staggerFadeIn = trigger('staggerFadeIn', [
  transition(':enter', [
    query('.step-card, .value-card, .stat-item, .hero-inner > *', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(60, [
        animate('450ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);

export const tabAnimation = trigger('tabAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate('250ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const toastAnimation = trigger('toastAnimation', [
  transition(':enter', [
    style({ transform: 'translateX(120%)', opacity: 0 }),
    animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateX(120%)', opacity: 0 }))
  ])
]);
