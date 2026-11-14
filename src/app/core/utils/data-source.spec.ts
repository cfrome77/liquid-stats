import { resolveDataBaseUrl } from "./data-source";

describe("resolveDataBaseUrl", () => {
  const BUCKET = "https://liquid-stats-abc123.s3.amazonaws.com/";

  it("routes an S3 DATA_URL through the /api-data/ proxy off localhost", () => {
    expect(resolveDataBaseUrl(BUCKET, "liquid-stats.netlify.app")).toBe(
      "/api-data/",
    );
  });

  it("does not proxy on localhost, so local dev reads the bucket directly", () => {
    expect(resolveDataBaseUrl(BUCKET, "localhost")).toBe(BUCKET);
    expect(resolveDataBaseUrl(BUCKET, "127.0.0.1")).toBe(BUCKET);
  });

  it("falls back to the bundled fixtures when DATA_URL is empty", () => {
    expect(resolveDataBaseUrl("", "liquid-stats.netlify.app")).toBe(
      "assets/data/",
    );
  });

  it("uses a non-S3 DATA_URL as given, off localhost", () => {
    expect(
      resolveDataBaseUrl("https://cdn.example.com/data", "example.com"),
    ).toBe("https://cdn.example.com/data/");
  });

  it("normalises a missing trailing slash but preserves an existing one", () => {
    expect(
      resolveDataBaseUrl("https://cdn.example.com/data", "example.com"),
    ).toBe("https://cdn.example.com/data/");
    expect(
      resolveDataBaseUrl("https://cdn.example.com/data/", "example.com"),
    ).toBe("https://cdn.example.com/data/");
  });
});
