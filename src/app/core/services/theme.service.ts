import { Injectable, signal, computed } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private themeSignal = signal<"light-theme" | "dark-theme">(
    this.getInitialTheme(),
  );

  // Expose as a read-only signal
  readonly currentTheme = this.themeSignal.asReadonly();

  constructor() {}

  private getInitialTheme(): "light-theme" | "dark-theme" {
    const savedTheme = localStorage.getItem("theme") as
      | "light-theme"
      | "dark-theme";
    if (savedTheme) {
      return savedTheme;
    }
    // Default to dark-theme if no preference is saved
    return "dark-theme";
  }

  toggleTheme(): void {
    const newTheme =
      this.themeSignal() === "light-theme" ? "dark-theme" : "light-theme";
    this.themeSignal.set(newTheme);
    localStorage.setItem("theme", newTheme);
  }

  setTheme(theme: "light-theme" | "dark-theme"): void {
    this.themeSignal.set(theme);
    localStorage.setItem("theme", theme);
  }

  getCurrentTheme(): "light-theme" | "dark-theme" {
    return this.themeSignal();
  }
}
