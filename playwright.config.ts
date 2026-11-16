import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4200",
    trace: "on-first-retry",
    // Emulate a dark OS preference. ThemeService follows prefers-color-scheme
    // until the user chooses a theme, so pinning it keeps runs deterministic.
    colorScheme: "dark",
  },
  webServer: {
    // Use the `e2e` serve configuration. The base `serve` target resolves to
    // the production build, which replaces environment.ts with the generated
    // environment.prod.ts, and `development` replaces it with the git-ignored
    // environment.local.ts. Neither exists on a fresh checkout, so e2e uses a
    // configuration that relies only on the committed environment.ts.
    command: "npm run start:e2e",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env["CI"],
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
