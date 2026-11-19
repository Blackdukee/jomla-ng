import { Injectable, signal } from '@angular/core';

export interface NotificationPreferences {
  emailNotifications: boolean;
  dealCompletions: boolean;
  inAppAlerts: boolean;
}

const STORAGE_KEY = 'jomla_notif_prefs';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  dealCompletions: true,
  inAppAlerts: true,
};

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private _preferences = signal<NotificationPreferences>(this.loadFromStorage());
  readonly preferences = this._preferences.asReadonly();

  private loadFromStorage(): NotificationPreferences {
    if (typeof localStorage === 'undefined') {
      return { ...DEFAULT_PREFERENCES };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PREFERENCES };
      const parsed = JSON.parse(raw) as Partial<NotificationPreferences> | null;
      return {
        emailNotifications: typeof parsed?.emailNotifications === 'boolean' ? parsed.emailNotifications : DEFAULT_PREFERENCES.emailNotifications,
        dealCompletions: typeof parsed?.dealCompletions === 'boolean' ? parsed.dealCompletions : DEFAULT_PREFERENCES.dealCompletions,
        inAppAlerts: typeof parsed?.inAppAlerts === 'boolean' ? parsed.inAppAlerts : DEFAULT_PREFERENCES.inAppAlerts,
      };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  save(prefs: NotificationPreferences): void {
    const next: NotificationPreferences = { ...prefs };
    this._preferences.set(next);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota / private-mode write errors
      }
    }
  }
}
