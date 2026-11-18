/**
 * Guards WCAG AA contrast for the theme colour tokens declared in
 * `src/styles.css`. The tokens are read from the live cascade so the assertions
 * fail if a token value regresses in either theme.
 */

function relativeLuminance(color: string): number {
  const hex = color.trim().replace("#", "");
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(normalized.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
}

describe("theme colour token contrast", () => {
  const themeClasses = ["light-theme", "dark-theme"] as const;
  const containers: HTMLElement[] = [];

  function token(theme: (typeof themeClasses)[number], name: string): string {
    const el = document.createElement("div");
    el.className = theme;
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    containers.push(el);
    return getComputedStyle(el).getPropertyValue(name).trim();
  }

  afterEach(() => {
    containers.splice(0).forEach((el) => el.remove());
  });

  it("renders the accent fills with AA-compliant text in both themes", () => {
    for (const theme of themeClasses) {
      const accent = token(theme, "--accent-blue");
      const onAccent = token(theme, "--on-accent-blue");
      expect(accent).not.toBe("");
      expect(onAccent).not.toBe("");
      expect(contrastRatio(onAccent, accent))
        .withContext(`${theme}: on-accent text on accent fill`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it("renders accent text against the page background with AA contrast", () => {
    for (const theme of themeClasses) {
      const bg = token(theme, "--bg-color");
      for (const name of [
        "--accent-blue",
        "--accent-glow",
        "--accent-amber",
        "--type-page",
        "--type-brewery",
        "--type-style",
      ]) {
        const value = token(theme, name);
        expect(value).not.toBe("");
        expect(contrastRatio(value, bg))
          .withContext(`${theme}: ${name} on ${bg}`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("renders solid primary/success fills with AA-compliant text", () => {
    const onSolid = token("light-theme", "--on-solid-fill");
    for (const fill of ["--btn-primary", "--success-green"]) {
      const background = token("light-theme", fill);
      expect(contrastRatio(onSolid, background))
        .withContext(`${fill} with --on-solid-fill text`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps muted text legible on the card surface in both themes", () => {
    for (const theme of themeClasses) {
      const muted = token(theme, "--muted-text");
      const surface = token(theme, "--card-bg-solid");
      expect(muted).not.toBe("");
      expect(contrastRatio(muted, surface))
        .withContext(`${theme}: --muted-text on ${surface}`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });
});
