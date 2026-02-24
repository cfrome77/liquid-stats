import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { Badge } from "../models/badge.model";
import { CheckinResponse } from "../models/checkin.model";

@Injectable({
  providedIn: "root",
})
export class DataService {
  private baseUrl = this.determineBaseUrl();

  constructor(private http: HttpClient) {}

  private determineBaseUrl(): string {
    const url = environment.DATA_URL || "";
    const isNetlify =
      typeof window !== "undefined" &&
      (window.location.hostname.endsWith(".netlify.app") ||
        window.location.hostname.includes("netlify.app"));

    // If we're on Netlify and the DATA_URL is set to S3, use the local proxy to avoid CORS issues
    if (isNetlify && url.includes("s3.amazonaws.com")) {
      console.log("[DataService] On Netlify, using /api-data/ proxy for S3");
      return "/api-data/";
    }

    return url.endsWith("/") ? url : `${url}/`;
  }

  public getBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.baseUrl}badges.json`);
  }

  public getBeers(): Observable<any> {
    return this.http.get<CheckinResponse>(`${this.baseUrl}beers.json`);
  }

  public getCheckins(): Observable<CheckinResponse> {
    return this.http.get<CheckinResponse>(`${this.baseUrl}checkins.json`);
  }

  public getWishlist(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}wishlist.json`);
  }
}
