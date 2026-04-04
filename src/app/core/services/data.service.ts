import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { Badge } from "../models/badge.model";
import { CheckinResponse } from "../models/checkin.model";
import { LoggingService } from "./logger.service";
import { BeerCheckin } from "../models/beer.model";

@Injectable({
  providedIn: "root",
})
export class DataService {
  private http = inject(HttpClient);
  private logger = inject(LoggingService);

  private baseUrl = this.determineBaseUrl();

  private determineBaseUrl(): string {
    const url = environment.DATA_URL || "";
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!isLocalhost && url.includes("s3.amazonaws.com")) {
      // Fixed: Replaced console.log with LoggingService to satisfy 'no-console' rule
      this.logger.info(
        "[DataService] Remote environment, using /api-data/ proxy for S3",
      );
      return "/api-data/";
    }

    if (!url) return "";
    return url.endsWith("/") ? url : `${url}/`;
  }

  public getBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.baseUrl}badges.json`);
  }

  // Fixed: Replaced 'any' with 'unknown' or specific types if available
  public getStats(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}stats.json`);
  }

  public getBeers(): Observable<unknown> {
    return this.getBeersAll();
  }

  public getBeersAll(): Observable<{ beers: BeerCheckin[] }> {
    return this.http.get<{ beers: BeerCheckin[] }>(
      `${this.baseUrl}beers_all.json`,
    );
  }

  public getCheckins(): Observable<CheckinResponse> {
    return this.http.get<CheckinResponse>(`${this.baseUrl}checkins.json`);
  }

  public getWishlist(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}wishlist.json`);
  }
}
