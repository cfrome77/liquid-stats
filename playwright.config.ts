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
  },
  webServer: {
    // Use the base `serve` target: the `development` configuration replaces
    // environment.ts with the git-ignored environment.local.ts, which does not
    // exist on a fresh CI checkout.
    command: "npm run start",
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
