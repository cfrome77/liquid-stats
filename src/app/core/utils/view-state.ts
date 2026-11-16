export type ViewMode = "cards" | "compact";

export const DEFAULT_VIEW: ViewMode = "cards";
export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 10;
export const PER_PAGE_OPTIONS = [10, 20, 30, 50];

/** Query-parameter keys used to persist list view state in the URL. */
export const VIEW_STATE_PARAMS = {
  view: "view",
  page: "page",
  perPage: "perPage",
  search: "q",
} as const;

/** Narrows an arbitrary query value to a supported view mode. */
export function parseViewMode(value: unknown): ViewMode {
  return value === "compact" ? "compact" : DEFAULT_VIEW;
}

/**
 * Parses a positive integer query value, falling back when it is missing,
 * non-numeric, or out of the allowed set.
 */
export function parsePositiveInt(
  value: unknown,
  fallback: number,
  allowed?: number[],
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  if (allowed && !allowed.includes(parsed)) return fallback;
  return parsed;
}

/**
 * Clamps a page number into `1..totalPages` so a hand-edited or stale URL can
 * never point past the end of the data.
 */
export function clampPage(page: number, totalPages: number): number {
  const max = Math.max(1, totalPages);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), max);
}

/**
 * Builds the query params for the current view state, omitting defaults so
 * the canonical URL stays clean (and only non-default state is shareable).
 */
export function viewStateParams(
  state: {
    view: ViewMode;
    page: number;
    perPage: number;
    search?: string;
  },
  defaults?: { perPage?: number },
): Record<string, string | null> {
  const defaultPerPage = defaults?.perPage ?? DEFAULT_PER_PAGE;
  const trimmedSearch = state.search?.trim();
  return {
    [VIEW_STATE_PARAMS.view]: state.view === DEFAULT_VIEW ? null : state.view,
    [VIEW_STATE_PARAMS.page]:
      state.page > DEFAULT_PAGE ? String(state.page) : null,
    [VIEW_STATE_PARAMS.perPage]:
      state.perPage === defaultPerPage ? null : String(state.perPage),
    [VIEW_STATE_PARAMS.search]: trimmedSearch ? trimmedSearch : null,
  };
}
