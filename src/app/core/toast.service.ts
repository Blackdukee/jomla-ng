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

  show(title: string, description?: string, type: Toast['type'] = 'info', duration = 4000) {
    const id = this.nextId++;
    this._toasts.update(t => [...t, { id, title, description, type }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(title: string, description?: string) { this.show(title, description, 'success'); }
  error(title: string, description?: string)   { this.show(title, description, 'danger'); }
  warning(title: string, description?: string) { this.show(title, description, 'warning'); }

  remove(id: number) {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }
}
