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
//
// Any file that already exists is validated before the build proceeds: a
// hand-edited override with a malformed value should fail here, next to the
// script that owns these files, instead of surfacing as a broken bundle.
const fs = require("fs");
const path = require("path");
const { validateEnv, report } = require("./env-validation");

const envDir = path.resolve(__dirname, "../src/environments");

// The value slots a generated environment file must satisfy. `production` is a
// boolean literal rather than an interpolated string, so it is not checked, and
// nothing is required here: the seeded defaults are deliberately empty and only
// generate-env.js, which runs for a production deploy, insists on real values.
const spec = {
  DATA_URL: { dataUrl: true },
  UNTAPPD_USERNAME: {},
  GA4_MEASUREMENT_ID: { ga4: true },
};

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

/**
 * Reads the `KEY: "value"` pairs out of a generated environment file. Only the
 * shape this script writes is understood; anything else is reported so a
 * malformed file does not pass silently.
 *
 * @param {string} source
 * @returns {Record<string, string> | null}
 */
function parseEnvironmentFile(source) {
  const values = {};
  for (const name of Object.keys(spec)) {
    const match = source.match(new RegExp(`${name}:\\s*"([^"]*)"`));
    if (!match) return null;
    values[name] = match[1];
  }
  return values;
}

/**
 * Validates the environment values already present in `file`, if it exists.
 *
 * @param {string} file
 * @returns {boolean} true when the file is missing or valid.
 */
function validateExisting(file) {
  const targetPath = path.join(envDir, file);
  if (!fs.existsSync(targetPath)) return true;

  const values = parseEnvironmentFile(fs.readFileSync(targetPath, "utf8"));
  if (values === null) {
    console.error(
      `ensure-local-env: ${file} does not match the expected environment shape.`,
    );
    process.exitCode = 1;
    return false;
  }

  return report(validateEnv(values, spec), `ensure-local-env (${file})`);
}

function main() {
  for (const { file, content } of targets) {
    if (!validateExisting(file)) return;
  }

  for (const { file, content } of targets) {
    const targetPath = path.join(envDir, file);
    if (fs.existsSync(targetPath)) continue;
    fs.writeFileSync(targetPath, content);
    console.log(`Created src/environments/${file} from committed defaults.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseEnvironmentFile, validateExisting, targets };
