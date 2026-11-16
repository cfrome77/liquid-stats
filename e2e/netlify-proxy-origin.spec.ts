import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The /api-data/* proxy target in netlify.toml is derived from DATA_URL at build
 * time by scripts/inject-proxy-origin.js. A legacy `sed` fallback used to be
 * chained after that script and, whenever DATA_URL was unset, rewrote the
 * placeholder the script deliberately left alone into an empty target
 * (to = "/:splat"), corrupting the redirect. These tests pin the build command
 * to the script alone and exercise the real script so the regression cannot
 * return.
 */
const repoRoot = path.resolve(__dirname, "..");
const netlifyToml = readFileSync(path.join(repoRoot, "netlify.toml"), "utf8");
const PLACEHOLDER = "S3_ORIGIN_PLACEHOLDER";

function buildCommand(): string {
  const match = netlifyToml.match(/^command\s*=\s*"(.*)"\s*$/m);
  if (!match) throw new Error("netlify.toml has no [build] command");
  return match[1];
}

// Runs the real injection script against a throwaway copy of netlify.toml and
// returns the resulting config.
function runInjection(dataUrl: string | undefined): string {
  const dir = mkdtempSync(path.join(tmpdir(), "inject-proxy-origin-"));
  try {
    mkdirSync(path.join(dir, "scripts"));
    for (const rel of ["scripts/inject-proxy-origin.js", "netlify.toml"]) {
      cpSync(path.join(repoRoot, rel), path.join(dir, rel));
    }

    const env = { ...process.env };
    if (dataUrl === undefined) delete env["DATA_URL"];
    else env["DATA_URL"] = dataUrl;

    execFileSync(
      process.execPath,
      [path.join(dir, "scripts", "inject-proxy-origin.js")],
      { env, stdio: "pipe" },
    );

    return readFileSync(path.join(dir, "netlify.toml"), "utf8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function proxyTarget(config: string): string {
  const match = config.match(/to = "([^"]*:splat)"/);
  if (!match) throw new Error("no /api-data/ proxy target found");
  return match[1];
}

test.describe("netlify /api-data/ proxy origin injection", () => {
  test("build command uses inject:proxy-origin and no sed fallback", () => {
    const command = buildCommand();
    expect(command).toContain("npm run inject:proxy-origin");
    expect(command).not.toMatch(/\bsed\b/);
  });

  test("keeps the placeholder when DATA_URL is unset", () => {
    const config = runInjection(undefined);
    expect(proxyTarget(config)).toBe(`${PLACEHOLDER}:splat`);
    expect(config).not.toContain("/:splat");
  });

  test("substitutes DATA_URL with exactly one trailing slash", () => {
    expect(proxyTarget(runInjection("https://bucket.example.com/"))).toBe(
      "https://bucket.example.com/:splat",
    );
    expect(proxyTarget(runInjection("https://bucket.example.com"))).toBe(
      "https://bucket.example.com/:splat",
    );
  });
});
