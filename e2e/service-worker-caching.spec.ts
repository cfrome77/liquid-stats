import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The service worker config decides what is prefetched at install time versus
 * fetched on demand. Fonts are needed to render the first paint, so they are
 * prefetched; images are lazy so a phone never downloads the full-resolution
 * desktop art up front. Data payloads are versioned separately from the app and
 * must follow a freshness policy so a stale JSON does not survive an update.
 *
 * Assertions read ngsw-config.json directly, so a future edit that drops a group
 * or flips an install mode fails here instead of only after a deploy.
 */
const config = JSON.parse(
  readFileSync(path.resolve(__dirname, "..", "ngsw-config.json"), "utf8"),
) as {
  assetGroups: Array<{
    name: string;
    installMode?: string;
    updateMode?: string;
    resources: { files?: string[] };
  }>;
  dataGroups?: Array<{
    name: string;
    urls: string[];
    cacheConfig: { strategy?: string; maxSize: number; maxAge: string };
  }>;
};

function group(name: string) {
  const found = config.assetGroups.find((g) => g.name === name);
  if (!found) throw new Error(`no asset group named "${name}"`);
  return found;
}

test.describe("service worker caching config", () => {
  test("prefetches fonts so first paint is not blocked on the network", () => {
    const fonts = group("fonts");
    expect(fonts.installMode).toBe("prefetch");
    expect(fonts.resources.files?.join(" ")).toContain("woff2");
  });

  test("lazy-loads images so large art is fetched on demand", () => {
    const images = group("images");
    expect(images.installMode).toBe("lazy");
    expect(images.updateMode).toBe("lazy");
    expect(images.resources.files?.join(" ")).toMatch(/webp/);
  });

  test("keeps the app shell prefetched", () => {
    expect(group("app").installMode).toBe("prefetch");
  });

  test("caches data payloads separately with a freshness strategy", () => {
    const data = config.dataGroups?.find((g) => g.name === "app-data");
    expect(data).toBeDefined();
    expect(data!.cacheConfig.strategy).toBe("freshness");
    expect(data!.cacheConfig.maxSize).toBeGreaterThan(0);
    // The data group must cover both the local fixtures and the proxy path.
    expect(data!.urls.join(" ")).toContain("/assets/data/");
    expect(data!.urls.join(" ")).toContain("/api-data/");
  });
});

test.describe("rendered images load lazily", () => {
  for (const path of [
    "/checkins",
    "/top-beers",
    "/beer-history",
    "/wishlist",
  ]) {
    test(`card thumbnails on ${path} use loading="lazy"`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const imgs = page.locator("app-card img");
      const count = await imgs.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const loading = await imgs.nth(i).getAttribute("loading");
        expect(loading, `image ${i} on ${path}`).toBe("lazy");
      }
    });
  }

  test("carousel images are lazy beyond the eagerly-loaded leading set", async ({
    page,
  }) => {
    await page.goto("/");
    const imgs = page.locator(".carousel-track .beer-card img");
    const count = await imgs.count();
    expect(count).toBeGreaterThan(4);
    for (let i = 4; i < count; i++) {
      expect(await imgs.nth(i).getAttribute("loading")).toBe("lazy");
    }
  });
});
