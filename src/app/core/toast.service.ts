import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  private sanitizeErrorMessage(msg: string | null | undefined): string | undefined {
    if (!msg) return undefined;
    
    const lower = msg.toLowerCase();
    
    if (
      lower.includes('exception') ||
      lower.includes('sql') ||
      lower.includes('database') ||
      lower.includes('ef core') ||
      lower.includes('null') ||
      lower.includes('reference') ||
      lower.includes('constraint') ||
      lower.includes('foreign key') ||
      lower.includes('cannot convert') ||
      lower.includes('invalidoperation') ||
      lower.includes('at jomla.') ||
      lower.includes('stripe payment hold failed:') ||
      lower.includes('paymentintent') ||
      lower.includes('return_url') ||
      lower.includes('automatic_payment_methods') ||
      lower.includes('setup intents') ||
      lower.includes('network') ||
      lower.includes('cors') ||
      lower.includes('http') ||
      lower.includes('localhost')
    ) {
      return 'An unexpected system error occurred. Please try again later.';
    }
    
    return msg;
  }

  show(title: string, description?: string, type: Toast['type'] = 'info', duration = 4000) {
    const id = this.nextId++;
    const finalDescription = type === 'danger' ? this.sanitizeErrorMessage(description) : description;
    this._toasts.update(t => [...t, { id, title, description: finalDescription, type }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(title: string, description?: string) { this.show(title, description, 'success'); }
  error(title: string, description?: string) { this.show(title, description, 'danger'); }
  errorApi(title: string, err: any) {
    const description =
      err?.error?.error ||
      err?.error?.detail ||
      err?.error?.title ||
      err?.message ||
      'An unexpected error occurred.';
    this.error(title, description);
  }
  warning(title: string, description?: string) { this.show(title, description, 'warning'); }

  remove(id: number) {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }
}
