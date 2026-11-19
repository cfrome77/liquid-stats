// scripts/env-validation.js
//
// Shared validation for the scripts that turn environment variables into the
// committed-then-git-ignored environment files (`generate-env.js`,
// `ensure-local-env.js`). A build must fail *before* it writes a file when a
// value is malformed - or, in strict mode, when a variable a production deploy
// needs is missing - rather than shipping a bundle that points at an unusable
// data source.
//
// Two classes of problem are caught:
//
//   1. Values that are structurally unsafe. The generators interpolate values
//      into a `"..."` TypeScript literal, so a quote, backslash or newline would
//      break out of the string (and, for a quote, inject code).
//   2. Values that are well-formed strings but not valid for their slot, e.g. a
//      DATA_URL that is not an http(s) URL or a GA4 id that is not `G-XXXXXXX`.

/** A GA4 measurement id, e.g. `G-ABCD1234`. */
const GA4_PATTERN = /^G-[A-Z0-9]+$/;

/** Characters that would corrupt the generated `"..."` literal. */
const UNSAFE_CHARS = /["\\\n\r]/;

/** True when `value` carries a URL scheme (e.g. `https://`, `ftp://`). */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * @param {string} value
 * @returns {boolean} true when `value` parses as an absolute http(s) URL.
 */
function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * The app accepts either an absolute http(s) origin (a deployed S3 bucket) or a
 * relative path (the bundled `assets/data/` fixtures used in development), so a
 * value is valid when it is one of those and invalid when it names any other
 * scheme.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isRelativeOrHttpUrl(value) {
  if (HAS_SCHEME.test(value)) return isHttpUrl(value);
  return true;
}

/**
 * Validates environment variables against a per-variable spec.
 *
 * @param {Record<string, string | undefined>} env
 * @param {Record<string, { url?: boolean, dataUrl?: boolean, ga4?: boolean, required?: boolean }>} spec
 * @param {{ strict?: boolean }} [options]
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateEnv(env, spec, options = {}) {
  const strict = options.strict === true;
  const errors = [];
  const warnings = [];

  for (const [name, rules] of Object.entries(spec)) {
    const value = (env[name] ?? "").trim();

    if (!value) {
      if (rules.required === true) {
        const message = `${name} is not set; a production deploy must provide it`;
        if (strict) errors.push(message);
        else warnings.push(message);
      }
      continue;
    }

    if (UNSAFE_CHARS.test(value)) {
      errors.push(
        `${name} contains a quote, backslash or newline, which would corrupt the generated file`,
      );
      continue;
    }

    if (rules.url === true && !isHttpUrl(value)) {
      errors.push(
        `${name} is not a valid http(s) URL: ${JSON.stringify(value)}`,
      );
    }

    if (rules.dataUrl === true && !isRelativeOrHttpUrl(value)) {
      errors.push(
        `${name} must be an http(s) URL or a relative path: ${JSON.stringify(value)}`,
      );
    }

    if (rules.ga4 === true && !GA4_PATTERN.test(value)) {
      errors.push(
        `${name} is not a valid GA4 measurement id (expected G-XXXXXXX): ${JSON.stringify(value)}`,
      );
    }
  }

  return { errors, warnings };
}

/**
 * Prints the result of {@link validateEnv} and marks the process as failed when
 * there are errors. Callers must check the return value and stop before writing
 * anything.
 *
 * @param {{ errors: string[], warnings: string[] }} result
 * @param {string} prefix
 * @returns {boolean} true when there are no errors.
 */
function report(result, prefix) {
  for (const warning of result.warnings) {
    console.warn(`${prefix}: warning: ${warning}`);
  }
  for (const error of result.errors) {
    console.error(`${prefix}: ${error}`);
  }
  if (result.errors.length > 0) {
    console.error(
      `${prefix}: refusing to continue with an invalid environment.`,
    );
    process.exitCode = 1;
    return false;
  }
  return true;
}

module.exports = {
  GA4_PATTERN,
  UNSAFE_CHARS,
  isHttpUrl,
  isRelativeOrHttpUrl,
  validateEnv,
  report,
};
