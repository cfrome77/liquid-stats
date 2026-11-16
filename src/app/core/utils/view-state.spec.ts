import {
  DEFAULT_PER_PAGE,
  DEFAULT_VIEW,
  PER_PAGE_OPTIONS,
  clampPage,
  parsePositiveInt,
  parseViewMode,
  viewStateParams,
} from "./view-state";

describe("view-state", () => {
  describe("parseViewMode", () => {
    it("accepts the known modes", () => {
      expect(parseViewMode("cards")).toBe("cards");
      expect(parseViewMode("compact")).toBe("compact");
    });

    it("falls back to the default for anything else", () => {
      expect(parseViewMode("grid")).toBe(DEFAULT_VIEW);
      expect(parseViewMode(undefined)).toBe(DEFAULT_VIEW);
      expect(parseViewMode(null)).toBe(DEFAULT_VIEW);
      expect(parseViewMode(42)).toBe(DEFAULT_VIEW);
    });
  });

  describe("parsePositiveInt", () => {
    it("parses valid positive integers", () => {
      expect(parsePositiveInt("3", 1)).toBe(3);
      expect(parsePositiveInt(7, 1)).toBe(7);
    });

    it("falls back for missing, invalid, or non-positive values", () => {
      expect(parsePositiveInt(undefined, 1)).toBe(1);
      expect(parsePositiveInt("abc", 1)).toBe(1);
      expect(parsePositiveInt("0", 1)).toBe(1);
      expect(parsePositiveInt("-4", 1)).toBe(1);
      expect(parsePositiveInt("2.5", 1)).toBe(1);
    });

    it("enforces an allowed set when provided", () => {
      expect(parsePositiveInt("20", 10, PER_PAGE_OPTIONS)).toBe(20);
      expect(parsePositiveInt("99", 10, PER_PAGE_OPTIONS)).toBe(10);
    });
  });

  describe("clampPage", () => {
    it("clamps into range", () => {
      expect(clampPage(3, 5)).toBe(3);
      expect(clampPage(99, 5)).toBe(5);
      expect(clampPage(0, 5)).toBe(1);
      expect(clampPage(-2, 5)).toBe(1);
    });

    it("handles an empty result set", () => {
      expect(clampPage(4, 0)).toBe(1);
    });
  });

  describe("viewStateParams", () => {
    it("omits default state so the canonical URL stays clean", () => {
      expect(
        viewStateParams({ view: "cards", page: 1, perPage: DEFAULT_PER_PAGE }),
      ).toEqual({ view: null, page: null, perPage: null, q: null });
    });

    it("serialises non-default state", () => {
      expect(
        viewStateParams({
          view: "compact",
          page: 3,
          perPage: 20,
          search: " ipa ",
        }),
      ).toEqual({ view: "compact", page: "3", perPage: "20", q: "ipa" });
    });

    it("honours a custom per-page default", () => {
      expect(
        viewStateParams(
          { view: "cards", page: 1, perPage: 20 },
          { perPage: 20 },
        ).perPage,
      ).toBeNull();
    });

    it("drops a blank search term", () => {
      expect(
        viewStateParams({ view: "cards", page: 1, perPage: 10, search: "   " })
          .q,
      ).toBeNull();
    });
  });
});
