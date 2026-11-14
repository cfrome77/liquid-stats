import { test, expect } from "@playwright/test";

/**
 * Guards the committed local fixtures in `src/assets/data`. These files stand
 * in for the S3 JSON during development and for every unmocked e2e test, so a
 * field quietly disappearing (or an edge case being dropped while tidying the
 * data) should fail here rather than as a confusing failure somewhere else.
 *
 * Assertions read the bytes the dev server actually serves, so they cover the
 * same path the app fetches.
 */
type Json = Record<string, unknown>;

async function fetchJson(
  request: import("@playwright/test").APIRequestContext,
  path: string,
): Promise<Json> {
  const res = await request.get(`/assets/data/${path}`);
  expect(res.status(), `${path} should be served`).toBe(200);
  return (await res.json()) as Json;
}

function isNonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v);
}

test.describe("local fixture integrity", () => {
  test("beers_all.json rows satisfy every field the app reads unguarded", async ({
    request,
  }) => {
    const data = await fetchJson(request, "beers_all.json");
    const beers = data["beers"] as Json[];
    expect(Array.isArray(beers)).toBe(true);
    expect(beers.length).toBeGreaterThan(1);

    for (const [i, b] of beers.entries()) {
      const beer = b["beer"] as Json;
      const brewery = b["brewery"] as Json;
      const location = brewery["location"] as Json;

      expect(isFiniteNumber(beer["bid"]), `beers[${i}].beer.bid`).toBe(true);
      expect(isNonEmptyString(beer["beer_name"]), `beers[${i}].beer_name`).toBe(
        true,
      );
      // beer-history and stats read these without optional chaining.
      expect(
        isNonEmptyString(beer["beer_style"]),
        `beers[${i}].beer_style`,
      ).toBe(true);
      expect(isFiniteNumber(beer["beer_abv"]), `beers[${i}].beer_abv`).toBe(
        true,
      );
      expect(
        isNonEmptyString(brewery["brewery_name"]),
        `beers[${i}].brewery.brewery_name`,
      ).toBe(true);
      expect(
        isNonEmptyString(brewery["country_name"]),
        `beers[${i}].brewery.country_name`,
      ).toBe(true);
      // marker.service reads location.lat/lng/state/city without guarding.
      expect(typeof location, `beers[${i}].brewery.location`).toBe("object");
      expect(isFiniteNumber(location["lat"]), `beers[${i}].location.lat`).toBe(
        true,
      );
      expect(isFiniteNumber(location["lng"]), `beers[${i}].location.lng`).toBe(
        true,
      );
      expect(
        isNonEmptyString(location["brewery_state"]),
        `beers[${i}].location.brewery_state`,
      ).toBe(true);
      expect(
        isFiniteNumber(b["rating_score"]),
        `beers[${i}].rating_score`,
      ).toBe(true);
      expect(isFiniteNumber(b["count"]), `beers[${i}].count`).toBe(true);
      expect(
        isNonEmptyString(b["recent_created_at"]),
        `beers[${i}].recent_created_at`,
      ).toBe(true);
    }
  });

  test("checkins.json rows carry the fields the card transform reads", async ({
    request,
  }) => {
    const data = await fetchJson(request, "checkins.json");
    const items = (data["response"] as Json)["checkins"] as Json;
    const checkins = items["items"] as Json[];
    expect(checkins.length).toBeGreaterThan(1);

    for (const [i, c] of checkins.entries()) {
      const beer = c["beer"] as Json;
      const brewery = c["brewery"] as Json;
      expect(isFiniteNumber(c["checkin_id"]), `checkins[${i}].checkin_id`).toBe(
        true,
      );
      expect(
        isFiniteNumber(c["rating_score"]),
        `checkins[${i}].rating_score`,
      ).toBe(true);
      expect(
        Number.isFinite(Date.parse(c["created_at"] as string)),
        `checkins[${i}].created_at should parse`,
      ).toBe(true);
      expect(isFiniteNumber(beer["bid"]), `checkins[${i}].beer.bid`).toBe(true);
      expect(
        isNonEmptyString(beer["beer_name"]),
        `checkins[${i}].beer.beer_name`,
      ).toBe(true);
      expect(
        isNonEmptyString(brewery["brewery_name"]),
        `checkins[${i}].brewery.brewery_name`,
      ).toBe(true);
      expect(
        typeof brewery["location"],
        `checkins[${i}].brewery.location`,
      ).toBe("object");
    }
  });

  test("badges.json entries carry the fields the badge card reads", async ({
    request,
  }) => {
    const data = await fetchJson(request, "badges.json");
    const badges = data as unknown as Json[];
    expect(Array.isArray(badges)).toBe(true);
    expect(badges.length).toBeGreaterThan(0);

    for (const [i, b] of badges.entries()) {
      expect(isNonEmptyString(b["badge_name"]), `badges[${i}].badge_name`).toBe(
        true,
      );
      const media = b["media"] as Json;
      expect(
        isNonEmptyString(media["badge_image_sm"]),
        `badges[${i}].media.badge_image_sm`,
      ).toBe(true);
    }
  });

  test("wishlist.json entries carry the fields the wishlist card reads", async ({
    request,
  }) => {
    const data = await fetchJson(request, "wishlist.json");
    const items = ((data["response"] as Json)["beers"] as Json)[
      "items"
    ] as Json[];
    expect(items.length).toBeGreaterThan(0);

    for (const [i, w] of items.entries()) {
      expect(
        isNonEmptyString((w["beer"] as Json)["beer_name"]),
        `wishlist[${i}].beer.beer_name`,
      ).toBe(true);
      expect(
        isNonEmptyString((w["brewery"] as Json)["brewery_name"]),
        `wishlist[${i}].brewery.brewery_name`,
      ).toBe(true);
    }
  });

  test("stats.json agrees with the beer rows it summarises", async ({
    request,
  }) => {
    const stats = await fetchJson(request, "stats.json");
    const beers = (await fetchJson(request, "beers_all.json"))[
      "beers"
    ] as Json[];

    const totalCheckins = beers.reduce(
      (sum, b) => sum + (b["count"] as number),
      0,
    );
    const countries = new Set(
      beers.map((b) => (b["brewery"] as Json)["country_name"]),
    );
    const breweries = new Set(
      beers.map((b) => (b["brewery"] as Json)["brewery_name"]),
    );

    expect(stats["totalCheckins"]).toBe(totalCheckins);
    expect(stats["countriesTried"]).toBe(countries.size);
    expect(stats["breweriesVisited"]).toBe(breweries.size);
    expect(isFiniteNumber(stats["averageRating"])).toBe(true);
  });

  test("fixtures keep the edge cases they exist to exercise", async ({
    request,
  }) => {
    const beers = (await fetchJson(request, "beers_all.json"))[
      "beers"
    ] as Json[];
    const checkins = (
      (await fetchJson(request, "checkins.json"))["response"] as Json
    )["checkins"] as Json;
    const items = checkins["items"] as Json[];

    // A beer with no label at all: the card must skip the image, not request it.
    expect(
      beers.some((b) => (b["beer"] as Json)["beer_label"] === ""),
      "expected at least one beer with an empty label",
    ).toBe(true);

    // A check-in with a user photo, so the carousel's photo branch is covered.
    expect(
      items.some((c) => (c["media"] as Json | undefined)?.["items"]),
      "expected at least one check-in with media",
    ).toBe(true);

    // A check-in without media, so the label fallback branch is covered.
    expect(
      items.some((c) => c["media"] === undefined),
      "expected at least one check-in without media",
    ).toBe(true);

    // Non-ASCII names and an over-long name, to exercise rendering and truncation.
    const names = beers.map((b) => (b["beer"] as Json)["beer_name"] as string);
    expect(
      names.some((n) => /[^\u0000-\u007f]/.test(n)),
      "expected at least one non-ASCII beer name",
    ).toBe(true);
    expect(
      names.some((n) => n.length > 60),
      "expected at least one over-long beer name",
    ).toBe(true);

    // More than one country and brewery, so grouping code has something to group.
    const countries = new Set(
      beers.map((b) => (b["brewery"] as Json)["country_name"]),
    );
    expect(countries.size).toBeGreaterThan(1);
  });
});
