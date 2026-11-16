import { TestBed } from "@angular/core/testing";

import { ThemeService } from "./theme.service";

/** Minimal, controllable stand-in for a `(prefers-color-scheme: light)` query. */
function stubMatchMedia(prefersLight: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const mql = {
    matches: prefersLight,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listeners.add(cb);
    },
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listeners.delete(cb);
    },
  };
  const spy = window.matchMedia as jasmine.Spy;
  const existing = spy?.and ? spy : spyOn(window, "matchMedia");
  existing.and.returnValue(mql as unknown as MediaQueryList);
  return {
    setLight(matches: boolean) {
      mql.matches = matches;
      listeners.forEach((cb) => cb({ matches }));
    },
  };
}

describe("ThemeService", () => {
  let meta: HTMLMetaElement;

  beforeEach(() => {
    localStorage.clear();
    // Remove any theme-color meta the test host may already define.
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((el) => el.remove());
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", "#000000");
    document.head.appendChild(meta);

    // Default the stub to a dark OS preference so unrelated tests are stable.
    stubMatchMedia(false);

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    meta.remove();
    localStorage.clear();
  });

  it("defaults to the dark theme when nothing is saved", () => {
    const service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe("dark-theme");
    expect(service.getCurrentTheme()).toBe("dark-theme");
  });

  it("follows a light OS preference when nothing is saved", () => {
    stubMatchMedia(true);
    const service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe("light-theme");
  });

  it("lets an explicit saved choice override the OS preference", () => {
    stubMatchMedia(true);
    localStorage.setItem("theme", "dark-theme");
    const service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe("dark-theme");
  });

  it("follows live OS changes until the user picks a theme", () => {
    const mql = stubMatchMedia(false);
    const service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe("dark-theme");

    mql.setLight(true);
    expect(service.currentTheme()).toBe("light-theme");

    // Once the user chooses, OS changes are ignored.
    service.setTheme("dark-theme");
    mql.setLight(true);
    expect(service.currentTheme()).toBe("dark-theme");
  });

  it("restores a saved theme on creation", () => {
    localStorage.setItem("theme", "light-theme");
    const service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe("light-theme");
  });

  it("toggles between light and dark", () => {
    const service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe("dark-theme");

    service.toggleTheme();
    expect(service.currentTheme()).toBe("light-theme");

    service.toggleTheme();
    expect(service.currentTheme()).toBe("dark-theme");
  });

  it("persists the theme and updates the theme-color meta tag", () => {
    const service = TestBed.inject(ThemeService);

    service.setTheme("light-theme");
    expect(localStorage.getItem("theme")).toBe("light-theme");
    expect(meta.getAttribute("content")).toBe("#f8fafc");

    service.setTheme("dark-theme");
    expect(localStorage.getItem("theme")).toBe("dark-theme");
    expect(meta.getAttribute("content")).toBe("#0f172a");
  });

  it("does not throw when the theme-color meta tag is absent", () => {
    meta.remove();
    const service = TestBed.inject(ThemeService);
    expect(() => service.setTheme("light-theme")).not.toThrow();
  });
});
