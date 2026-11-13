import { TestBed } from "@angular/core/testing";

import { ThemeService } from "./theme.service";

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
