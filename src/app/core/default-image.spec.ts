import { DEFAULT_IMAGE, applyDefaultImage } from "./default-image";

describe("default-image", () => {
  it("points at the bundled beer placeholder, not a remote service", () => {
    expect(DEFAULT_IMAGE).toBe("assets/images/beer-placeholder.svg");
    expect(DEFAULT_IMAGE).not.toContain("http");
  });

  it("sets the fallback src on a failed image", () => {
    const img = document.createElement("img");
    img.src = "https://example.com/broken.jpg";
    applyDefaultImage({ target: img } as unknown as Event);
    expect(img.getAttribute("src")).toBe(DEFAULT_IMAGE);
  });

  it("does not re-assign the fallback, so a broken placeholder cannot loop", () => {
    const img = document.createElement("img");
    img.setAttribute("src", DEFAULT_IMAGE);
    const before = img.getAttribute("src");
    applyDefaultImage({ target: img } as unknown as Event);
    expect(img.getAttribute("src")).toBe(before);
  });

  it("ignores events without an image target", () => {
    expect(() =>
      applyDefaultImage({ target: null } as unknown as Event),
    ).not.toThrow();
  });
});
