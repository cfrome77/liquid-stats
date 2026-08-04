import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { environment } from "../../../environments/environment";
import { Badge } from "../models/badge.model";
import { CheckinResponse, Checkin } from "../models/checkin.model";
import { BeerCheckin } from "../models/beer.model";
import { upgradeToHdUrl, sanitizeUntappdUrl } from "../utils/url-utils";

@Injectable({
  providedIn: "root",
})
export class DataService {
  private http = inject(HttpClient);

  private baseUrl = this.determineBaseUrl();

  private determineBaseUrl(): string {
    const url = environment.DATA_URL || "";
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // If we're not on localhost and the DATA_URL is set to S3, use the local proxy to avoid CORS issues.
    // This works for both Netlify subdomains and custom domains because of the netlify.toml redirect.
    if (!isLocalhost && url.includes("s3.amazonaws.com")) {
      // eslint-disable-next-line no-console
      console.log(
        "[DataService] Remote environment, using /api-data/ proxy for S3",
      );
      return "/api-data/";
    }

    if (!url) return "assets/data/";
    return url.endsWith("/") ? url : `${url}/`;
  }

  public getBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.baseUrl}badges.json`);
  }

  public getStats(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}stats.json`);
  }

  public getBeers(): Observable<BeerCheckin[]> {
    return this.getBeersAll();
  }

  public getBeersAll(): Observable<BeerCheckin[]> {
    return this.http.get<unknown>(`${this.baseUrl}beers_all.json`).pipe(
      map((data: unknown) => {
        const d = data as {
          beers?: BeerCheckin[];
          response?: { checkins?: { items?: BeerCheckin[] } };
        };
        const beers =
          d?.beers ||
          d?.response?.checkins?.items ||
          (Array.isArray(data) ? (data as BeerCheckin[]) : []);

        // Mutate to add HD labels and sanitize original labels to prevent 403s on fallbacks
        return beers.map((b) => ({
          ...b,
          beer: {
            ...b.beer,
            beer_label: sanitizeUntappdUrl(b.beer?.beer_label) || "",
            beer_label_hd: upgradeToHdUrl(b.beer?.beer_label),
          },
          brewery: {
            ...b.brewery,
            brewery_label: sanitizeUntappdUrl(b.brewery?.brewery_label) || "",
            brewery_label_hd: upgradeToHdUrl(b.brewery?.brewery_label),
          },
        }));
      }),
    );
  }

  public getCheckins(): Observable<CheckinResponse> {
    return this.http.get<CheckinResponse>(`${this.baseUrl}checkins.json`).pipe(
      map((response) => {
        if (response?.response?.checkins?.items) {
          response.response.checkins.items =
            response.response.checkins.items.map((c: Checkin) => ({
              ...c,
              beer: {
                ...c.beer,
                beer_label: sanitizeUntappdUrl(c.beer?.beer_label) || "",
                beer_label_hd: upgradeToHdUrl(c.beer?.beer_label),
              },
              brewery: {
                ...c.brewery,
                brewery_label:
                  sanitizeUntappdUrl(c.brewery?.brewery_label) || "",
                brewery_label_hd: upgradeToHdUrl(c.brewery?.brewery_label),
              },
            }));
        }
        return response;
      }),
    );
  }

  public getWishlist(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}wishlist.json`).pipe(
      map((data) => {
        const d = data as { response?: { beers?: { items?: BeerCheckin[] } } };
        if (d?.response?.beers?.items) {
          d.response.beers.items = d.response.beers.items.map((b) => ({
            ...b,
            beer: {
              ...b.beer,
              beer_label: sanitizeUntappdUrl(b.beer?.beer_label) || "",
              beer_label_hd: upgradeToHdUrl(b.beer?.beer_label),
            },
            brewery: {
              ...b.brewery,
              brewery_label: sanitizeUntappdUrl(b.brewery?.brewery_label) || "",
              brewery_label_hd: upgradeToHdUrl(b.brewery?.brewery_label),
            },
          }));
        }
        return d;
      }),
    );
  }
}
