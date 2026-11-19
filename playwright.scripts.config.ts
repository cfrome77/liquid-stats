import { defineConfig } from "@playwright/test";

/**
 * Non-browser specs that exercise build scripts (env validation, netlify proxy
 * injection). They need neither the Angular dev server nor a browser, so they
 * run on their own config with no `webServer`, which lets the build job gate on
 * them before spending time compiling the app.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /(env-script-validation|netlify-proxy-origin)\.spec\.ts$/,
  reporter: "list",
});
