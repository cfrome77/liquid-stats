import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<'light-theme' | 'dark-theme'>(this.getInitialTheme());
  theme$ = this.themeSubject.asObservable();

  constructor() { }

  private getInitialTheme(): 'light-theme' | 'dark-theme' {
    const savedTheme = localStorage.getItem('theme') as 'light-theme' | 'dark-theme';
    if (savedTheme) {
      return savedTheme;
    }
    // Default to dark-theme if no preference is saved
    return 'dark-theme';
  }

  toggleTheme(): void {
    const currentTheme = this.themeSubject.value;
    const newTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
    this.themeSubject.next(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  setTheme(theme: 'light-theme' | 'dark-theme'): void {
    this.themeSubject.next(theme);
    localStorage.setItem('theme', theme);
  }

  getCurrentTheme(): 'light-theme' | 'dark-theme' {
    return this.themeSubject.value;
  }
}
