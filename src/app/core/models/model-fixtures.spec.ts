import beersAllJson from "../../../assets/data/beers_all.json";
import checkinsJson from "../../../assets/data/checkins.json";
import wishlistJson from "../../../assets/data/wishlist.json";
import statsJson from "../../../assets/data/stats.json";
import { BeerCheckin, WishlistBeer, WishlistResponse } from "./beer.model";
import { Checkin, CheckinResponse } from "./checkin.model";
import { QuickStats } from "./stats.model";

/**
 * These fixtures are the bundled stand-ins for the live Untappd payloads, so the
 * model interfaces must stay assignable from them. The typed bindings below are
 * the contract: if a required property is removed from a model or added to the
 * fixtures without a matching model field, this file stops compiling.
 */
const beers: BeerCheckin[] = beersAllJson.beers;
const checkins: Checkin[] = checkinsJson.response.checkins.items;
const wishlist: WishlistBeer[] = wishlistJson.response.beers.items;
const stats: QuickStats = statsJson;

describe("model / fixture contract", () => {
  it("types the stats fixture as QuickStats", () => {
    expect(stats.totalCheckins).toBeGreaterThan(0);
    expect(typeof stats.averageRating).toBe("number");
    expect(typeof stats.countriesTried).toBe("number");
    expect(typeof stats.breweriesVisited).toBe("number");
    expect(stats.lastUpdated).toBeTruthy();
  });

  it("keeps beers_all.json assignable to BeerCheckin", () => {
    expect(beers.length).toBeGreaterThan(0);
    for (const entry of beers) {
      expect(typeof entry.beer.beer_name).toBe("string");
      expect(typeof entry.beer.beer_style).toBe("string");
      expect(typeof entry.brewery.brewery_name).toBe("string");
      expect(typeof entry.brewery.country_name).toBe("string");
      expect(typeof entry.rating_score).toBe("number");
      expect(typeof entry.first_created_at).toBe("string");
      expect(typeof entry.recent_created_at).toBe("string");
    }
  });

  it("keeps checkins.json assignable to CheckinResponse", () => {
    const response: CheckinResponse = checkinsJson;
    expect(response.response.checkins.items.length).toBeGreaterThan(0);
    for (const checkin of checkins) {
      expect(typeof checkin.checkin_id).toBe("number");
      expect(typeof checkin.created_at).toBe("string");
      expect(typeof checkin.rating_score).toBe("number");
      expect(typeof checkin.beer.beer_name).toBe("string");
      expect(typeof checkin.brewery.brewery_name).toBe("string");
      expect(typeof checkin.brewery.country_name).toBe("string");
    }
  });

  it("treats checkin_comment as optional because some check-ins omit it", () => {
    const withoutComment = checkins.filter(
      (c) => c.checkin_comment === undefined,
    );
    expect(withoutComment.length).toBeGreaterThan(0);
    for (const checkin of withoutComment) {
      expect("checkin_comment" in checkin).toBeFalse();
    }
  });

  it("supports both object and string badge images in checkins.json", () => {
    const badges = checkins.flatMap((c) => c.badges?.items ?? []);
    expect(badges.length).toBeGreaterThan(0);
    for (const badge of badges) {
      expect(typeof badge.badge_name).toBe("string");
      const isObject = typeof badge.badge_image === "object";
      expect(isObject || typeof badge.badge_image === "string").toBeTrue();
    }
  });

  it("keeps wishlist.json assignable to WishlistResponse", () => {
    const response: WishlistResponse = wishlistJson;
    expect(response.response.beers.items.length).toBeGreaterThan(0);
    for (const item of wishlist) {
      expect(typeof item.beer.beer_name).toBe("string");
      expect(typeof item.beer.beer_slug).toBe("string");
      expect(typeof item.brewery.brewery_name).toBe("string");
    }
  });
});
