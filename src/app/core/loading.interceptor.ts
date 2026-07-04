import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from './services/loading.service';
import { finalize } from 'rxjs';

/** URL fragments that should never trigger the global loading bar. */
const SILENT_URL_PATTERNS = [
  '/notifications',
  '/hubs/',
];

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  const isSilent = SILENT_URL_PATTERNS.some(pattern => req.url.includes(pattern));
  if (isSilent) {
    return next(req);
  }

  // Show global loader
  loadingService.show();

  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
