import { ImageLoaderConfig } from "@angular/common";

/**
 * Resolves image URLs for `NgOptimizedImage`. Kept in one place so the app
 * bootstrap and the test environment share identical behaviour.
 */
export function imageLoader(config: ImageLoaderConfig): string {
  const url = config.src;
  const width = config.width;

  if (typeof url !== "string") {
    return "";
  }

  // Local hero logo: serve the small variant for narrow slots.
  if (url.includes("LiquidStatsLogo.webp")) {
    if (width && width <= 400) {
      return url.replace("LiquidStatsLogo.webp", "LiquidStatsLogo-400w.webp");
    }
    return url;
  }

  // Untappd / untp.beer reject the larger variants (403), so force _sm.
  if (url.includes("untappd.com") || url.includes("untp.beer")) {
    if (/_(sm|md|lg)\./.test(url)) {
      return url.replace(/_(sm|md|lg)\./, `_sm.`);
    }
    return url;
  }

  return url;
}
