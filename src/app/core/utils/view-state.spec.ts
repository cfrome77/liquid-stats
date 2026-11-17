import {
  DEFAULT_PER_PAGE,
  DEFAULT_VIEW,
  FilterFieldState,
  PER_PAGE_OPTIONS,
  clampPage,
  decodeFilters,
  encodeFilters,
  isIsoDate,
  parsePositiveInt,
  parseViewMode,
  sameMembers,
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

  describe("sameMembers", () => {
    it("ignores order and duplicates", () => {
      expect(sameMembers(["a", "b"], ["b", "a"])).toBeTrue();
      expect(sameMembers(["a", "b"], ["a"])).toBeFalse();
    });
  });

  describe("isIsoDate", () => {
    it("accepts real calendar days", () => {
      expect(isIsoDate("2026-03-01")).toBeTrue();
      expect(isIsoDate("2024-02-29")).toBeTrue();
    });

    it("rejects malformed or impossible dates", () => {
      expect(isIsoDate("2026-3-1")).toBeFalse();
      expect(isIsoDate("2026-02-30")).toBeFalse();
      expect(isIsoDate("not-a-date")).toBeFalse();
      expect(isIsoDate(undefined)).toBeFalse();
    });
  });

  describe("encodeFilters / decodeFilters", () => {
    const options = ["Alpha", "Beta", "Gamma"];
    const fields: Record<string, FilterFieldState> = {
      brewery: { selected: options, options },
      beer_style: { selected: options, options, type: "text" },
      date: {
        selected: ["2026-01-01", "2026-06-01"],
        options: ["2026-01-01", "2026-06-01"],
        type: "date",
      },
    };

    it("omits fields still at their default selection", () => {
      expect(encodeFilters(fields)).toBeNull();
    });

    it("round-trips a narrowed selection", () => {
      const encoded = encodeFilters({
        ...fields,
        brewery: { selected: ["Beta"], options },
      });
      expect(encoded).toContain("Beta");
      expect(decodeFilters(encoded, fields).brewery).toEqual(["Beta"]);
    });

    it("preserves an intentionally empty selection", () => {
      const encoded = encodeFilters({
        ...fields,
        brewery: { selected: [], options },
      });
      expect(decodeFilters(encoded, fields).brewery).toEqual([]);
    });

    it("round-trips a narrowed date range", () => {
      const encoded = encodeFilters({
        ...fields,
        date: {
          selected: ["2026-02-01", "2026-03-01"],
          options: ["2026-01-01", "2026-06-01"],
          type: "date",
        },
      });
      expect(decodeFilters(encoded, fields).date).toEqual([
        "2026-02-01",
        "2026-03-01",
      ]);
    });

    it("falls back to defaults for missing, malformed, or unknown values", () => {
      expect(decodeFilters(null, fields)).toEqual({});
      expect(decodeFilters("not json", fields)).toEqual({});
      expect(decodeFilters('["array"]', fields)).toEqual({});
      // Unknown option is dropped, leaving the field at its default.
      expect(
        decodeFilters('{"brewery":["Nope"]}', fields).brewery,
      ).toBeUndefined();
      expect(
        decodeFilters('{"brewery":"Beta"}', fields).brewery,
      ).toBeUndefined();
    });

    it("clamps a date range into the available bounds", () => {
      const decoded = decodeFilters(
        '{"date":["2020-01-01","2030-01-01"]}',
        fields,
      );
      expect(decoded.date).toEqual(["2026-01-01", "2026-06-01"]);
    });

    it("rejects an inverted date range", () => {
      const decoded = decodeFilters(
        '{"date":["2026-05-01","2026-02-01"]}',
        fields,
      );
      expect(decoded.date).toEqual([]);
    });

    it("drops malformed date values entirely", () => {
      expect(
        decodeFilters('{"date":["nonsense","2026-02-01"]}', fields).date,
      ).toBeUndefined();
    });
  });
});
