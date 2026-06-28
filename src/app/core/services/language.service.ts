import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLang = signal<'en' | 'ar'>('en');

  constructor() {
    effect(() => {
      const lang = this.currentLang();
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      // Toggle font-family for localized typography
      if (lang === 'ar') {
        document.body.style.fontFamily = "'Cairo', sans-serif";
      } else {
        document.body.style.fontFamily = "'Inter', sans-serif";
      }
    });
  }

  toggleLanguage() {
    this.currentLang.update(l => l === 'en' ? 'ar' : 'en');
  }
}
