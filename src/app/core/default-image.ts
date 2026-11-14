/**
 * Local, beer-themed fallback shown when a beer/brewery image is missing or
 * fails to load. Served from `assets/images` so it works offline and never
 * depends on a third-party placeholder service.
 */
export const DEFAULT_IMAGE = "assets/images/beer-placeholder.svg";

/**
 * Points a failed `<img>` at {@link DEFAULT_IMAGE}, but only once so a broken
 * fallback cannot re-trigger the handler in an infinite loop. The comparison
 * uses the resolved path, because the browser reports `img.src` as an absolute
 * URL even when the markup used a relative one.
 */
export function applyDefaultImage(event: Event): void {
  const img = event.target as HTMLImageElement | null;
  if (!img) return;
  if (img.getAttribute("src") === DEFAULT_IMAGE) return;
  img.src = DEFAULT_IMAGE;
}
