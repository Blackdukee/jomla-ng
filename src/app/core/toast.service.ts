import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

interface ApiErrorBody {
  errors?: unknown;
  detail?: unknown;
  error?: unknown;
  message?: unknown;
  title?: unknown;
}

interface ApiErrorLike {
  status?: number;
  message?: unknown;
  error?: string | ApiErrorBody | null;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  private static readonly INTERNAL_ERROR_PATTERNS: RegExp[] = [
    /\bat\s+jomla\./i,
    /\bsystem\.\w*exception\b/i,
    /\b(nullreference|invalidoperation|argument|dbupdate|dbupdateconcurrency)exception\b/i,
    /\bstack\s*trace\b/i,
    /\bef\s*core\b/i,
    /\b(sqlclient|sqlserver|sqlite|npgsql|postgres)\b/i,
    /\b(foreign\s+key|primary\s+key|unique)\s+constraint\b/i,
    /\bviolation\s+of\s+(primary|unique|foreign)\s+key\b/i,
    /\bcannot\s+insert\s+duplicate\s+key\b/i,
    /\bcannot\s+convert\b/i,
    /^http failure (response|during parsing) for /i,
    /https?:\/\/localhost[:/]/i,
    /stripe payment hold failed:/i,
    /\b(paymentintent|payment_intent|setup_intent|automatic_payment_methods|return_url)\b/i,
  ];

  private sanitizeErrorMessage(msg: string | null | undefined): string | undefined {
    if (!msg) return undefined;

    if (ToastService.INTERNAL_ERROR_PATTERNS.some(pattern => pattern.test(msg))) {
      return 'An unexpected system error occurred. Please try again later.';
    }

    return msg;
  }

  private extractValidationErrors(errors: unknown): string | undefined {
    if (!errors || typeof errors !== 'object') return undefined;

    const rawValues = Array.isArray(errors) ? errors : Object.values(errors as Record<string, unknown>);
    const messages: string[] = [];
    const seen = new Set<string>();

    for (const val of rawValues) {
      const items = Array.isArray(val) ? val : [val];
      for (const item of items) {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (trimmed && !seen.has(trimmed)) {
            seen.add(trimmed);
            messages.push(trimmed);
            if (messages.length >= 3) {
              return messages.join(' ');
            }
          }
        }
      }
    }

    return messages.length > 0 ? messages.join(' ') : undefined;
  }

  show(title: string, description?: string, type: Toast['type'] = 'info', duration = 4000) {
    const id = this.nextId++;
    const finalDescription = type === 'danger' ? this.sanitizeErrorMessage(description) : description;
    this._toasts.update(t => [...t, { id, title, description: finalDescription, type }]);
    const timer = setTimeout(() => this.remove(id), duration);
    this.timers.set(id, timer);
  }

  success(title: string, description?: string) { this.show(title, description, 'success'); }
  error(title: string, description?: string) { this.show(title, description, 'danger'); }
  errorApi(title: string, err: unknown) {
    const apiErr = (err && typeof err === 'object') ? (err as ApiErrorLike) : null;
    if (apiErr?.status === 0) {
      this.error(title, 'Unable to reach the server. Please check your connection and try again.');
      return;
    }

    const rawError = apiErr?.error;
    const body = (rawError && typeof rawError === 'object') ? rawError : null;
    const str = (val: unknown): string | undefined =>
      typeof val === 'string' && val ? val : undefined;

    const description =
      this.extractValidationErrors(body?.errors) ||
      str(body?.detail) ||
      str(body?.error) ||
      str(body?.message) ||
      (typeof rawError === 'string' && rawError.trim() ? rawError.trim() : undefined) ||
      str(body?.title) ||
      str(apiErr?.message) ||
      'An unexpected error occurred.';
    this.error(title, description);
  }
  warning(title: string, description?: string) { this.show(title, description, 'warning'); }

  remove(id: number) {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._toasts.update(t => t.filter(x => x.id !== id));
  }
}
