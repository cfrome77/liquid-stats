import { ImageLoaderConfig } from "@angular/common";
import { imageLoader } from "./image-loader";

function config(src: string, width?: number): ImageLoaderConfig {
  return { src, width } as ImageLoaderConfig;
}

describe("imageLoader", () => {
  it("returns an empty string for a non-string src", () => {
    expect(
      imageLoader({ src: undefined } as unknown as ImageLoaderConfig),
    ).toBe("");
  });

  it("serves the small logo variant when the slot is at most 400px wide", () => {
    expect(imageLoader(config("assets/images/LiquidStatsLogo.webp", 400))).toBe(
      "assets/images/LiquidStatsLogo-400w.webp",
    );
    expect(imageLoader(config("assets/images/LiquidStatsLogo.webp", 306))).toBe(
      "assets/images/LiquidStatsLogo-400w.webp",
    );
  });

  it("keeps the full-size logo when the slot is wider than 400px", () => {
    expect(
      imageLoader(config("assets/images/LiquidStatsLogo.webp", 1280)),
    ).toBe("assets/images/LiquidStatsLogo.webp");
  });

  it("keeps the full-size logo when no width is provided", () => {
    expect(imageLoader(config("assets/images/LiquidStatsLogo.webp"))).toBe(
      "assets/images/LiquidStatsLogo.webp",
    );
  });

  it("downgrades Untappd label variants to the small one to avoid 403s", () => {
    expect(
      imageLoader(
        config("https://assets.untappd.com/site/beer_logos/beer-1_abc_md.jpeg"),
      ),
    ).toBe("https://assets.untappd.com/site/beer_logos/beer-1_abc_sm.jpeg");
    expect(
      imageLoader(
        config("https://assets.untappd.com/site/beer_logos/beer-1_abc_lg.jpeg"),
      ),
    ).toBe("https://assets.untappd.com/site/beer_logos/beer-1_abc_sm.jpeg");
  });

  it("downgrades untp.beer variants to the small one", () => {
    expect(
      imageLoader(config("https://images.untp.beer/beer-1_abc_md.jpeg")),
    ).toBe("https://images.untp.beer/beer-1_abc_sm.jpeg");
  });

  it("leaves an already-small Untappd label untouched", () => {
    const src = "https://assets.untappd.com/site/beer_logos/beer-1_abc_sm.jpeg";
    expect(imageLoader(config(src))).toBe(src);
  });

  it("passes through any other URL unchanged", () => {
    const src = "https://example.com/photo.jpg";
    expect(imageLoader(config(src, 200))).toBe(src);
  });
});
