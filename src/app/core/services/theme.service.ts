import { Injectable, inject, signal } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private document = inject<Document>(DOCUMENT);

  private themeSignal = signal<"light-theme" | "dark-theme">(
    this.getInitialTheme(),
  );

  // Expose as a read-only signal
  readonly currentTheme = this.themeSignal.asReadonly();

  constructor() {
    this.applyThemeColor(this.themeSignal());
  }

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
    this.setTheme(newTheme);
  }

  setTheme(theme: "light-theme" | "dark-theme"): void {
    this.themeSignal.set(theme);
    localStorage.setItem("theme", theme);
    this.applyThemeColor(theme);
  }

  getCurrentTheme(): "light-theme" | "dark-theme" {
    return this.themeSignal();
  }

  /** Keeps the browser chrome (address bar) in sync with the active theme. */
  private applyThemeColor(theme: "light-theme" | "dark-theme"): void {
    const meta = this.document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        theme === "light-theme" ? "#f8fafc" : "#0f172a",
      );
    }
  }
}
