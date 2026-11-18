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
  filters: "filters",
  topRange: "range",
  topX: "topX",
  minCheckins: "min",
  customStart: "from",
} as const;

/**
 * Query-parameter keys used by the Insights charts to persist a clicked
 * category (`?style=`) or rating bin (`?rating=`) selection in the URL.
 */
export const CHART_FILTER_PARAMS = {
  style: "style",
  rating: "rating",
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

/** Order-agnostic membership comparison for two string arrays. */
export function sameMembers(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((value) => set.has(value));
}

/**
 * A field's current selection plus the options the data actually offers, used
 * as the allow-list when decoding a shared URL.
 */
export interface FilterFieldState {
  selected: readonly string[];
  options: readonly string[];
  /** `date` fields hold a `[start, end]` ISO range instead of a set. */
  type?: "text" | "date" | "number";
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a well-formed `YYYY-MM-DD` string that maps to a real calendar day. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const parts = value.split("-").map(Number);
  const year = parts[0]!;
  const month = parts[1]!;
  const day = parts[2]!;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Serialises the non-default filter selections into a single JSON query value.
 *
 * Only fields that differ from their default (the full option set, or the full
 * available date range) are written, so a canonical URL stays clean. An empty
 * array is kept so an intentional "nothing selected" state survives a reload.
 * Returns null when every field is still at its default.
 */
export function encodeFilters(
  fields: Record<string, FilterFieldState>,
): string | null {
  const payload: Record<string, string[]> = {};
  for (const [field, state] of Object.entries(fields)) {
    const selected = state.selected;
    if (selected.length === 0) {
      payload[field] = [];
      continue;
    }
    if (state.type === "date") {
      if (
        selected[0] === state.options[0] &&
        selected[1] === state.options[1]
      ) {
        continue;
      }
    } else if (sameMembers(selected, state.options)) {
      continue;
    }
    payload[field] = [...selected];
  }
  return Object.keys(payload).length > 0 ? JSON.stringify(payload) : null;
}

/**
 * Parses a JSON filter value, discarding anything that is not a known field,
 * not an array of strings, or not still present in the current options. Fields
 * that fail validation are omitted so the caller keeps its default. A missing or
 * unparsable value yields an empty object.
 */
export function decodeFilters(
  raw: string | null | undefined,
  fields: Record<string, FilterFieldState>,
): Record<string, string[]> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const result: Record<string, string[]> = {};
  for (const [field, state] of Object.entries(fields)) {
    const requested = (parsed as Record<string, unknown>)[field];
    if (!Array.isArray(requested)) continue;
    const values = requested.filter(
      (value): value is string => typeof value === "string",
    );
    if (values.length === 0) {
      result[field] = [];
      continue;
    }
    if (state.type === "date") {
      if (values.length === 2 && isIsoDate(values[0]) && isIsoDate(values[1])) {
        result[field] = clampDateRange(values[0], values[1], state.options);
      }
      continue;
    }
    const allowed = values.filter((value) => state.options.includes(value));
    if (allowed.length > 0) result[field] = allowed;
  }
  return result;
}

/**
 * Clamps a `[start, end]` range inside the available bounds and rejects an
 * inverted range, so a hand-edited URL cannot produce an empty result set.
 */
function clampDateRange(
  start: string,
  end: string,
  options: readonly string[],
): string[] {
  const rawMin = options[0];
  const rawMax = options[1];
  const min = isIsoDate(rawMin) ? rawMin : start;
  const max = isIsoDate(rawMax) ? rawMax : end;
  const clampedStart = start < min ? min : start > max ? max : start;
  const clampedEnd = end < min ? min : end > max ? max : end;
  return clampedStart > clampedEnd ? [] : [clampedStart, clampedEnd];
}
