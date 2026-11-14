/**
 * Beer and brewery labels ship from Untappd in two sizes: a small square
 * (about 100×100, ~10 kB) and an "hd" variant (e.g. 323×500, ~130 kB).
 *
 * List cards render labels at 38–54 px, where the small variant is
 * indistinguishable from the hd one but roughly 12× lighter, so cards should
 * always prefer it. Surfaces that genuinely render a label large (the home
 * carousel, at ~200 px) should keep requesting the hd variant directly.
 */
export function thumbnailLabel(
  label?: string,
  labelHd?: string,
): string | undefined {
  return label || labelHd;
}
