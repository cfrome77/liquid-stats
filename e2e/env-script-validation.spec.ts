import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * scripts/generate-env.js and scripts/ensure-local-env.js turn environment
 * variables into the git-ignored `environment.*.ts` files. Their values are
 * interpolated into `"..."` TypeScript literals, so a missing or malformed value
 * must fail the build *before* anything is written rather than ship a bundle
 * pointing at an unusable data source.
 *
 * These tests run the real scripts against a throwaway copy of the tree, so the
 * validation is exercised exactly as a build (or a Terraform run that builds
 * first) would invoke it.
 */
const repoRoot = path.resolve(__dirname, "..");
const SCRIPTS = [
  "scripts/env-validation.js",
  "scripts/generate-env.js",
  "scripts/ensure-local-env.js",
];

/** A throwaway tree containing only the scripts and the directories they write to. */
function makeSandbox(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "env-scripts-"));
  mkdirSync(path.join(dir, "scripts"));
  mkdirSync(path.join(dir, "src", "environments"), { recursive: true });
  for (const rel of SCRIPTS) {
    cpSync(path.join(repoRoot, rel), path.join(dir, rel));
  }
  return dir;
}

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Runs a script with exactly the given variables (the ambient environment is dropped). */
function run(
  dir: string,
  script: string,
  vars: Record<string, string>,
): RunResult {
  const env: Record<string, string> = {
    PATH: process.env["PATH"] ?? "",
    HOME: process.env["HOME"] ?? "",
  };
  for (const [key, value] of Object.entries(vars)) env[key] = value;

  try {
    const stdout = execFileSync(
      process.execPath,
      [path.join(dir, "scripts", script)],
      { env, stdio: "pipe", encoding: "utf8" },
    );
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const failure = error as {
      status?: number;
      stdout?: string;
      stderr?: string;
    };
    return {
      status: failure.status ?? 1,
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? "",
    };
  }
}

function prodEnvPath(dir: string): string {
  return path.join(dir, "src", "environments", "environment.prod.ts");
}

function localEnvPath(dir: string): string {
  return path.join(dir, "src", "environments", "environment.local.ts");
}

const VALID_PROD_VARS = {
  DATA_URL: "https://bucket.example.com/",
  UNTAPPD_USERNAME: "beer-fan",
  GA4_MEASUREMENT_ID: "G-ABC1234",
};

test.describe("generate-env.js strict validation", () => {
  test("fails and writes nothing when a required variable is missing", () => {
    const dir = makeSandbox();
    try {
      const result = run(dir, "generate-env.js", {
        DATA_URL: VALID_PROD_VARS.DATA_URL,
        // UNTAPPD_USERNAME intentionally omitted.
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("UNTAPPD_USERNAME is not set");
      expect(existsSync(prodEnvPath(dir))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when DATA_URL is not an http(s) URL", () => {
    const dir = makeSandbox();
    try {
      const result = run(dir, "generate-env.js", {
        ...VALID_PROD_VARS,
        DATA_URL: "ftp://bucket.example.com/",
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("DATA_URL is not a valid http(s) URL");
      expect(existsSync(prodEnvPath(dir))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when the GA4 id is malformed", () => {
    const dir = makeSandbox();
    try {
      const result = run(dir, "generate-env.js", {
        ...VALID_PROD_VARS,
        GA4_MEASUREMENT_ID: "not-a-measurement-id",
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("GA4_MEASUREMENT_ID is not a valid GA4");
      expect(existsSync(prodEnvPath(dir))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects a value that would break out of the generated string literal", () => {
    const dir = makeSandbox();
    try {
      const result = run(dir, "generate-env.js", {
        ...VALID_PROD_VARS,
        UNTAPPD_USERNAME: 'evil"; globalThis.pwned = true; const x = "',
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("would corrupt the generated file");
      expect(existsSync(prodEnvPath(dir))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("writes the environment file when every value is valid", () => {
    const dir = makeSandbox();
    try {
      const result = run(dir, "generate-env.js", VALID_PROD_VARS);
      expect(result.status).toBe(0);

      const written = readFileSync(prodEnvPath(dir), "utf8");
      expect(written).toContain(`DATA_URL: "${VALID_PROD_VARS.DATA_URL}"`);
      expect(written).toContain(
        `UNTAPPD_USERNAME: "${VALID_PROD_VARS.UNTAPPD_USERNAME}"`,
      );
      expect(written).toContain(
        `GA4_MEASUREMENT_ID: "${VALID_PROD_VARS.GA4_MEASUREMENT_ID}"`,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

test.describe("ensure-local-env.js validation", () => {
  test("seeds the missing environment files from committed defaults", () => {
    const dir = makeSandbox();
    try {
      const result = run(dir, "ensure-local-env.js", {});
      expect(result.status).toBe(0);
      expect(existsSync(localEnvPath(dir))).toBe(true);
      expect(existsSync(prodEnvPath(dir))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects an existing file whose DATA_URL is malformed", () => {
    const dir = makeSandbox();
    try {
      writeFileSync(
        localEnvPath(dir),
        `export const environment = {
  production: false,
  DATA_URL: "not-a-url-with-a-scheme://",
  UNTAPPD_USERNAME: "someone",
  GA4_MEASUREMENT_ID: "",
};
`,
      );

      const result = run(dir, "ensure-local-env.js", {});
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("DATA_URL must be an http(s) URL");
      // The file the user owns is left untouched.
      expect(readFileSync(localEnvPath(dir), "utf8")).toContain(
        "not-a-url-with-a-scheme://",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects an existing file that does not match the expected shape", () => {
    const dir = makeSandbox();
    try {
      writeFileSync(localEnvPath(dir), "export const environment = {};\n");

      const result = run(dir, "ensure-local-env.js", {});
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "does not match the expected environment shape",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("accepts an existing file with valid values", () => {
    const dir = makeSandbox();
    try {
      const source = `export const environment = {
  production: false,
  DATA_URL: "assets/data/",
  UNTAPPD_USERNAME: "test-user",
  GA4_MEASUREMENT_ID: "G-ABC1234",
};
`;
      writeFileSync(localEnvPath(dir), source);

      const result = run(dir, "ensure-local-env.js", {});
      expect(result.status).toBe(0);
      // An existing file is never rewritten.
      expect(readFileSync(localEnvPath(dir), "utf8")).toBe(source);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
