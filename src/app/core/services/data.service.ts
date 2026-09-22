import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, shareReplay, catchError, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { Badge } from "../models/badge.model";
import { CheckinResponse, Checkin } from "../models/checkin.model";
import { BeerCheckin } from "../models/beer.model";
import { upgradeToHdUrl, sanitizeUntappdUrl } from "../utils/url-utils";
import { LoggingService } from "./logger.service";

@Injectable({
  providedIn: "root",
})
export class DataService {
  private http = inject(HttpClient);
  private logger = inject(LoggingService);

  private baseUrl = this.determineBaseUrl();

  private badgesCache$?: Observable<Badge[]>;
  private statsCache$?: Observable<unknown>;
  private beersAllCache$?: Observable<BeerCheckin[]>;
  private checkinsCache$?: Observable<CheckinResponse>;
  private wishlistCache$?: Observable<unknown>;

  private determineBaseUrl(): string {
    const url = environment.DATA_URL || "";
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

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

  public clearCache(): void {
    this.badgesCache$ = undefined;
    this.statsCache$ = undefined;
    this.beersAllCache$ = undefined;
    this.checkinsCache$ = undefined;
    this.wishlistCache$ = undefined;
  }

  public getBadges(): Observable<Badge[]> {
    if (!this.badgesCache$) {
      this.badgesCache$ = this.http
        .get<Badge[]>(`${this.baseUrl}badges.json`)
        .pipe(
          catchError((err) => {
            this.logger.error("Error fetching badges.json", err);
            this.badgesCache$ = undefined;
            return throwError(() => err);
          }),
          shareReplay(1),
        );
    }
    return this.badgesCache$;
  }

  public getStats(): Observable<unknown> {
    if (!this.statsCache$) {
      this.statsCache$ = this.http
        .get<unknown>(`${this.baseUrl}stats.json`)
        .pipe(
          catchError((err) => {
            this.logger.error("Error fetching stats.json", err);
            this.statsCache$ = undefined;
            return throwError(() => err);
          }),
          shareReplay(1),
        );
    }
    return this.statsCache$;
  }

  public getBeers(): Observable<BeerCheckin[]> {
    return this.getBeersAll();
  }

  public getBeersAll(): Observable<BeerCheckin[]> {
    if (!this.beersAllCache$) {
      this.beersAllCache$ = this.http
        .get<unknown>(`${this.baseUrl}beers_all.json`)
        .pipe(
          map((data: unknown) => {
            const d = data as {
              beers?: BeerCheckin[];
              response?: { checkins?: { items?: BeerCheckin[] } };
            };
            const beers =
              d?.beers ||
              d?.response?.checkins?.items ||
              (Array.isArray(data) ? (data as BeerCheckin[]) : []);

            return beers.map((b) => ({
              ...b,
              beer: {
                ...b.beer,
                beer_label: sanitizeUntappdUrl(b.beer?.beer_label) || "",
                beer_label_hd: upgradeToHdUrl(b.beer?.beer_label),
              },
              brewery: {
                ...b.brewery,
                brewery_label:
                  sanitizeUntappdUrl(b.brewery?.brewery_label) || "",
                brewery_label_hd: upgradeToHdUrl(b.brewery?.brewery_label),
              },
            }));
          }),
          catchError((err) => {
            this.logger.error("Error fetching beers_all.json", err);
            this.beersAllCache$ = undefined;
            return throwError(() => err);
          }),
          shareReplay(1),
        );
    }
    return this.beersAllCache$;
  }

  public getCheckins(): Observable<CheckinResponse> {
    if (!this.checkinsCache$) {
      this.checkinsCache$ = this.http
        .get<CheckinResponse>(`${this.baseUrl}checkins.json`)
        .pipe(
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
          catchError((err) => {
            this.logger.error("Error fetching checkins.json", err);
            this.checkinsCache$ = undefined;
            return throwError(() => err);
          }),
          shareReplay(1),
        );
    }
    return this.checkinsCache$;
  }

  public getWishlist(): Observable<unknown> {
    if (!this.wishlistCache$) {
      this.wishlistCache$ = this.http
        .get<unknown>(`${this.baseUrl}wishlist.json`)
        .pipe(
          map((data) => {
            const d = data as {
              response?: { beers?: { items?: BeerCheckin[] } };
            };
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
                  brewery_label:
                    sanitizeUntappdUrl(b.brewery?.brewery_label) || "",
                  brewery_label_hd: upgradeToHdUrl(b.brewery?.brewery_label),
                },
              }));
            }
            return d;
          }),
          catchError((err) => {
            this.logger.error("Error fetching wishlist.json", err);
            this.wishlistCache$ = undefined;
            return throwError(() => err);
          }),
          shareReplay(1),
        );
    }
    return this.wishlistCache$;
  }
}
