// scripts/ensure-local-env.js
//
// Both the `development` and `production` build configurations replace the
// committed `environment.ts` with a git-ignored file, so a fresh checkout has
// neither and every script that builds through them (`start`, `start:dev`,
// `start:local`, `build`, `watch`) fails with "path in file replacements does
// not exist".
//
// This seeds the missing files from committed defaults. Existing files are left
// untouched so local overrides survive, and `build:prod` still overwrites
// environment.prod.ts via generate-env.js with the real deployment values.
const fs = require("fs");
const path = require("path");

const envDir = path.resolve(__dirname, "../src/environments");

const targets = [
  {
    file: "environment.local.ts",
    content: `export const environment = {
  production: false,
  DATA_URL: "assets/data/",
  UNTAPPD_USERNAME: "test-user",
  GA4_MEASUREMENT_ID: "",
};
`,
  },
  {
    file: "environment.prod.ts",
    content: `export const environment = {
  production: true,
  DATA_URL: "",
  UNTAPPD_USERNAME: "",
  GA4_MEASUREMENT_ID: "",
};
`,
  },
];

for (const { file, content } of targets) {
  const targetPath = path.join(envDir, file);
  if (fs.existsSync(targetPath)) continue;
  fs.writeFileSync(targetPath, content);
  console.log(`Created src/environments/${file} from committed defaults.`);
}
