// scripts/inject-proxy-origin.js
//
// The app reaches S3 through the /api-data/* proxy in netlify.toml. The bucket
// origin is recorded once, in the DATA_URL environment variable, which the app
// bundle also reads. Netlify does not expand ${...} in netlify.toml, but it does
// read [[redirects]] after the build, so this script writes DATA_URL into the
// file during the build and fails loudly if it cannot.
//
// It is a script rather than a sed one-liner because sed reports success when
// its pattern does not match, which would ship a proxy pointing at the literal
// placeholder with nothing to show for it.
const fs = require("fs");
const path = require("path");

const PLACEHOLDER = "S3_ORIGIN_PLACEHOLDER";
const configPath = path.resolve(__dirname, "../netlify.toml");

function fail(message) {
  console.error(`inject-proxy-origin: ${message}`);
  process.exitCode = 1;
}

const raw = (process.env.DATA_URL || "").trim();
const original = fs.readFileSync(configPath, "utf8");

if (!raw) {
  // No bucket configured: the app falls back to the bundled assets/data
  // fixtures, so the proxy is simply never requested. Leaving the placeholder
  // makes that visible rather than implying a working target.
  console.warn(
    "inject-proxy-origin: DATA_URL is empty; leaving the /api-data/ proxy " +
      "placeholder. The app will use the bundled assets/data fixtures.",
  );
} else {
  let origin;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("must be an http(s) URL");
    }
    // Keep any path, but guarantee exactly one trailing slash so the target
    // reads "<origin>/:splat".
    origin = `${raw.replace(/\/+$/, "")}/`;
  } catch {
    fail(`DATA_URL is not a valid http(s) URL: ${JSON.stringify(raw)}`);
  }

  if (origin) {
    if (!original.includes(PLACEHOLDER)) {
      if (original.includes(`${origin}:splat`)) {
        console.log("inject-proxy-origin: proxy origin already injected.");
      } else {
        fail(
          "could not find the /api-data/ proxy placeholder in netlify.toml; " +
            "refusing to build with an unknown proxy target.",
        );
      }
    } else {
      fs.writeFileSync(configPath, original.replaceAll(PLACEHOLDER, origin));
      console.log(
        `inject-proxy-origin: /api-data/* now proxies to ${origin}:splat`,
      );
    }
  }
}
