import { thumbnailLabel } from "./label-image";

describe("thumbnailLabel", () => {
  it("prefers the small variant for list thumbnails", () => {
    expect(thumbnailLabel("small.jpg", "large.jpg")).toBe("small.jpg");
  });

  it("falls back to the hd variant when no small variant exists", () => {
    expect(thumbnailLabel(undefined, "large.jpg")).toBe("large.jpg");
  });

  it("returns undefined when neither variant is available", () => {
    expect(thumbnailLabel(undefined, undefined)).toBeUndefined();
  });
});
