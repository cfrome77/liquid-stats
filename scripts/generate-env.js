// scripts/generate-env.js
const fs = require("fs");
const path = require("path");

const targetPath = path.resolve(
  __dirname,
  "../src/environments/environment.prod.ts",
);

const content = `export const environment = {
  production: true,
  DATA_URL: '${process.env.DATA_URL || ""}',
  UNTAPPD_USERNAME: '${process.env.UNTAPPD_USERNAME || ""}',
  GA4_MEASUREMENT_ID: '${process.env.GA4_MEASUREMENT_ID || ""}'
};
`;

fs.writeFileSync(targetPath, content);
console.log("✅ Injected environment.prod.ts for production build");
