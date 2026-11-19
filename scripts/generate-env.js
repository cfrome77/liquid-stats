// scripts/generate-env.js
//
// Writes the git-ignored environment.prod.ts for a production build from the
// deployment environment. Values are interpolated into a `"..."` TypeScript
// literal, so they are validated first: a malformed value fails the build
// before anything is written rather than shipping a broken bundle.
const fs = require("fs");
const path = require("path");
const { validateEnv, report } = require("./env-validation");

const targetPath = path.resolve(
  __dirname,
  "../src/environments/environment.prod.ts",
);

// A production deploy must point at a real data source and identify the user
// whose check-ins are linked, so these are required; a malformed DATA_URL or
// GA4 id is rejected even when present.
const spec = {
  DATA_URL: { required: true, url: true },
  UNTAPPD_USERNAME: { required: true },
  GA4_MEASUREMENT_ID: { ga4: true },
};

const result = validateEnv(process.env, spec, { strict: true });
if (!report(result, "generate-env")) {
  process.exit(1);
}

const content = `export const environment = {
  production: true,
  DATA_URL: "${process.env.DATA_URL || ""}",
  UNTAPPD_USERNAME: "${process.env.UNTAPPD_USERNAME || ""}",
  GA4_MEASUREMENT_ID: "${process.env.GA4_MEASUREMENT_ID || ""}",
};
`;

fs.writeFileSync(targetPath, content);
console.log("✅ Injected environment.prod.ts for production build");
