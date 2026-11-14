/**
 * Resolves the base URL the app fetches its JSON from.
 *
 * - On a non-localhost host with an S3 `DATA_URL`, route through the
 *   same-origin `/api-data/` proxy (see `netlify.toml`) so the browser never
 *   talks to S3 directly: no CORS preflight, and the bucket URL stays out of
 *   the shipped bundle.
 * - With no `DATA_URL`, fall back to the bundled fixtures in `assets/data/`.
 * - Otherwise use `DATA_URL` as given, normalised to a single trailing slash.
 */
export function resolveDataBaseUrl(dataUrl: string, hostname: string): string {
  const url = dataUrl || "";
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (!isLocalhost && url.includes("s3.amazonaws.com")) {
    return "/api-data/";
  }
  if (!url) return "assets/data/";
  return url.endsWith("/") ? url : `${url}/`;
}
