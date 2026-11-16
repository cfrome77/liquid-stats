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

  private systemPrefersLight?: MediaQueryList;

  constructor() {
    this.applyThemeColor(this.themeSignal());
    this.watchSystemPreference();
  }

  /**
   * Uses a saved choice when the user has made one; otherwise follows the OS
   * `prefers-color-scheme` so a first-time visitor sees the theme they expect.
   */
  private getInitialTheme(): "light-theme" | "dark-theme" {
    const savedTheme = localStorage.getItem("theme") as
      | "light-theme"
      | "dark-theme"
      | null;
    if (savedTheme) {
      return savedTheme;
    }
    return this.systemPrefersLight?.matches ? "light-theme" : "dark-theme";
  }

  /**
   * Follows live OS theme changes, but only while the user has not made an
   * explicit choice — an explicit choice always wins.
   */
  private watchSystemPreference(): void {
    const win = this.document.defaultView;
    if (!win?.matchMedia) return;

    this.systemPrefersLight = win.matchMedia("(prefers-color-scheme: light)");
    // Re-read now that the query exists (getInitialTheme ran first).
    if (!localStorage.getItem("theme")) {
      this.themeSignal.set(
        this.systemPrefersLight.matches ? "light-theme" : "dark-theme",
      );
      this.applyThemeColor(this.themeSignal());
    }

    this.systemPrefersLight.addEventListener?.("change", (event) => {
      if (localStorage.getItem("theme")) return;
      const theme = event.matches ? "light-theme" : "dark-theme";
      this.themeSignal.set(theme);
      this.applyThemeColor(theme);
    });
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
