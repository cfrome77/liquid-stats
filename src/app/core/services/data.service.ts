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
  private baseUrl = environment.dataUrl;

  constructor(private http: HttpClient) {}

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
