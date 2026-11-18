import {
  nearestBandIndex,
  resolveLabelIndex,
  type ChartLabelInput,
} from "./chart-hit-testing";

describe("chart label hit testing", () => {
  describe("nearestBandIndex", () => {
    it("returns the index of the closest band centre", () => {
      expect(nearestBandIndex(0, [0, 10, 20])).toBe(0);
      expect(nearestBandIndex(14, [0, 10, 20])).toBe(1);
      expect(nearestBandIndex(19, [0, 10, 20])).toBe(2);
    });

    it("returns null when there is no finite position or no bands", () => {
      expect(nearestBandIndex(Number.NaN, [0, 10])).toBeNull();
      expect(nearestBandIndex(5, [])).toBeNull();
    });

    it("skips bands with no usable centre", () => {
      expect(nearestBandIndex(30, [Number.NaN, 20, 40])).toBe(1);
    });
  });

  describe("resolveLabelIndex", () => {
    /** A vertical histogram: 20 columns, only column 3 has check-ins. */
    const histogram = (pointer: { x: number; y: number }): ChartLabelInput => ({
      orientation: "vertical",
      chartArea: { left: 0, right: 200, top: 0, bottom: 100 },
      pointer,
      bandCenters: Array.from({ length: 20 }, (_, i) => i * 10 + 5),
      values: Array.from({ length: 20 }, (_, i) => (i === 3 ? 4 : 0)),
    });

    /** A horizontal ranked chart: 3 rows, all populated. */
    const ranked = (pointer: { x: number; y: number }): ChartLabelInput => ({
      orientation: "horizontal",
      chartArea: { left: 60, right: 200, top: 0, bottom: 90 },
      pointer,
      bandCenters: [15, 45, 75],
      values: [6, 3, 2],
    });

    it("selects a column from a tap on its label below the plot", () => {
      expect(resolveLabelIndex(histogram({ x: 35, y: 130 }))).toBe(3);
    });

    it("ignores a tap on the label of an empty column", () => {
      expect(resolveLabelIndex(histogram({ x: 5, y: 130 }))).toBeNull();
    });

    it("selects a row from a tap on its label left of the plot", () => {
      expect(resolveLabelIndex(ranked({ x: 20, y: 45 }))).toBe(1);
    });

    it("ignores a tap inside the plot area, which Chart.js handles itself", () => {
      expect(resolveLabelIndex(histogram({ x: 35, y: 90 }))).toBeNull();
      expect(resolveLabelIndex(ranked({ x: 80, y: 15 }))).toBeNull();
    });

    it("ignores a tap beyond the first and last labels", () => {
      expect(resolveLabelIndex(ranked({ x: 20, y: -30 }))).toBeNull();
      expect(resolveLabelIndex(ranked({ x: 20, y: 200 }))).toBeNull();
    });

    it("ignores a tap in the strip but outside the category range", () => {
      // Left of the plot but above the first band.
      expect(resolveLabelIndex(ranked({ x: 20, y: -5 }))).toBeNull();
    });
  });
});
