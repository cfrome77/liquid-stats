/**
 * Ensures an Untappd URL points to the small version (_sm) to avoid 403 errors.
 */
export function sanitizeUntappdUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  if (url.includes("untappd.com") || url.includes("untp.beer")) {
    return url.replace(/_(lg|md)\./, "_sm.");
  }

  return url;
}

/**
 * Upgrades a low-resolution Untappd image URL to its HD counterpart.
 *
 * Rules:
 * - Beer Labels: /beer_logos/ -> /beer_logos_hd/, _sm.jpeg -> _hd.jpeg
 * - Brewery Logos: /brewery_logos/ -> /brewery_logos_hd/, [filename].jpeg -> [filename]_hd.jpeg
 */
export function upgradeToHdUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  let upgradedUrl = url;

  // 1. Handle Beer Labels
  if (upgradedUrl.includes('/beer_logos/')) {
    upgradedUrl = upgradedUrl.replace('/beer_logos/', '/beer_logos_hd/');
    if (upgradedUrl.includes('_sm.')) {
      upgradedUrl = upgradedUrl.replace('_sm.', '_hd.');
    } else {
      // If it doesn't have _sm, maybe it's another size or no size,
      // but the rule specifically mentions _sm.jpeg -> _hd.jpeg.
      // We'll try to ensure it ends with _hd before the extension.
      const lastDotIndex = upgradedUrl.lastIndexOf('.');
      if (lastDotIndex !== -1) {
          const extension = upgradedUrl.substring(lastDotIndex);
          const base = upgradedUrl.substring(0, lastDotIndex);
          if (!base.endsWith('_hd')) {
              upgradedUrl = base + '_hd' + extension;
          }
      }
    }
    return upgradedUrl;
  }

  // 2. Handle Brewery Logos
  if (upgradedUrl.includes('/brewery_logos/')) {
    upgradedUrl = upgradedUrl.replace('/brewery_logos/', '/brewery_logos_hd/');

    // Append or replace suffix to end with _hd
    const lastDotIndex = upgradedUrl.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const extension = upgradedUrl.substring(lastDotIndex);
      let base = upgradedUrl.substring(0, lastDotIndex);

      // Remove existing size suffixes if any (_sm, _md, _lg)
      base = base.replace(/_(sm|md|lg)$/, '');

      if (!base.endsWith('_hd')) {
        upgradedUrl = base + '_hd' + extension;
      } else {
          upgradedUrl = base + extension;
      }
    }
    return upgradedUrl;
  }

  return upgradedUrl;
}
