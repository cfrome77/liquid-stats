import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private baseUrl = environment.dataUrl;

  constructor(private http: HttpClient) { }

  public getBadges(): Observable<any> {
    // Append the JSON filename to the baseUrl
    return this.http.get<any>(`${this.baseUrl}badges.json`);
  }

  public getBeers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}beers.json`);
  }

  public getCheckins(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}checkins.json`);
  }

  public getWishlist(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}wishlist.json`);
  }
}
