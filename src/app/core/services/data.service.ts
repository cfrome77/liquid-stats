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
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // Use the local Express API if DATA_URL is not set or we're in production
    // For local development, it might still point to S3 or local JSONs.
    if (!isLocalhost || url === "/api/") {
      return "/api/";
    }

    if (!url) return "";
    return url.endsWith("/") ? url : `${url}/`;
  }

  public getBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.baseUrl}badges.json`);
  }

  public getBeers(limit?: number, offset?: number): Observable<any> {
    let url = this.baseUrl.includes("/api/")
      ? `${this.baseUrl}beers`
      : `${this.baseUrl}beers.json`;
    const params: any = {};
    if (limit !== undefined) params.limit = limit.toString();
    if (offset !== undefined) params.offset = offset.toString();

    return this.http.get<CheckinResponse>(url, { params });
  }

  public getCheckins(limit?: number, offset?: number): Observable<CheckinResponse> {
    let url = this.baseUrl.includes("/api/")
      ? `${this.baseUrl}checkins`
      : `${this.baseUrl}checkins.json`;
    const params: any = {};
    if (limit !== undefined) params.limit = limit.toString();
    if (offset !== undefined) params.offset = offset.toString();

    return this.http.get<CheckinResponse>(url, { params });
  }

  public getWishlist(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}wishlist.json`);
  }
}
