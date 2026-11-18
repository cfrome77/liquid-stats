import type { Chart, Plugin } from "chart.js";

/**
 * Hit-testing for the Insights bar charts.
 *
 * Each chart draws one bar per category: the ranked style chart lays its bars
 * out horizontally (one row each) and the rating histogram vertically (one
 * column each). Chart.js's own `onClick` handles a tap on a bar, but it only
 * fires inside the plot area, and the axis labels are drawn outside it, so a
 * tap on a style or rating name is ignored. These helpers cover that strip so a
 * label selects the category it names.
 */

export type ChartOrientation = "horizontal" | "vertical";

export interface ChartAreaBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ChartLabelInput {
  orientation: ChartOrientation;
  chartArea: ChartAreaBounds;
  pointer: { x: number; y: number };
  /** Centre of each category band, along the category axis. */
  bandCenters: number[];
  /** One value per category; a falsy value means no bar is drawn. */
  values: number[];
}

/** Index of the category band nearest a position along the category axis. */
export function nearestBandIndex(
  pointerCross: number,
  bandCenters: number[],
): number | null {
  if (!Number.isFinite(pointerCross)) return null;

  let best: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < bandCenters.length; i++) {
    const center = bandCenters[i];
    if (center === undefined || !Number.isFinite(center)) continue;
    const distance = Math.abs(center - pointerCross);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/**
 * Category index a tap on an axis label selects, or null when the tap is not in
 * the label strip.
 *
 * Labels for a horizontal chart sit to the left of the plot area and for a
 * vertical chart below it. A category with no check-ins has no list to show, so
 * it is never a target.
 */
export function resolveLabelIndex(input: ChartLabelInput): number | null {
  const { orientation, chartArea, pointer, bandCenters, values } = input;
  const horizontal = orientation === "horizontal";

  const inLabelStrip = horizontal
    ? pointer.x < chartArea.left &&
      pointer.y >= chartArea.top &&
      pointer.y <= chartArea.bottom
    : pointer.y > chartArea.bottom &&
      pointer.x >= chartArea.left &&
      pointer.x <= chartArea.right;

  if (!inLabelStrip) return null;

  const pointerCross = horizontal ? pointer.y : pointer.x;
  const index = nearestBandIndex(pointerCross, bandCenters);
  if (index === null || !values[index]) return null;

  return index;
}

export interface ChartLabelTapCallbacks {
  /** Unique plugin id, so each chart can register its own instance. */
  id: string;
  /** Category index for a label-strip position, or null when not over a label. */
  resolveLabel: (chart: Chart, x: number, y: number) => number | null;
  /** Called when a tap lands on a label. */
  onSelect: (index: number) => void;
}

/**
 * Chart.js plugin that makes the axis labels clickable and shows a pointer
 * cursor over them.
 *
 * It works from the canvas events rather than `onClick`, because Chart.js only
 * calls `onClick` for pointers inside the plot area. Taps inside the plot area
 * are left to the chart's own `onHover`/`onClick`, so the two never both fire
 * for one tap. The `events` option on each chart controls which native events
 * reach this hook.
 */
export function createChartLabelTapPlugin(
  callbacks: ChartLabelTapCallbacks,
): Plugin {
  return {
    id: callbacks.id,
    afterEvent(chart, args) {
      const { event } = args;
      const style = chart.canvas?.style;

      if (event.type === "mouseout") {
        if (style) style.cursor = "";
        return;
      }

      if (event.x === null || event.y === null) return;
      if (chart.isPointInArea({ x: event.x, y: event.y })) return;

      const target = callbacks.resolveLabel(chart, event.x, event.y);
      if (style) style.cursor = target === null ? "default" : "pointer";

      if (event.type === "click" && target !== null) {
        callbacks.onSelect(target);
      }
    },
  };
}
