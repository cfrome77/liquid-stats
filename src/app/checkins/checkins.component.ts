import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-checkins',
  templateUrl: './checkins.component.html',
  styleUrls: ['./checkins.component.css'],
})
export class CheckinsComponent implements OnInit {
  public checkins: any;
  public starRating: any;

  constructor(private http: HttpClient) {
    this.getJSON().subscribe((data) => {
      this.checkins = data.response.checkins.items;
      console.log(data);
    });
  }

  ngOnInit(): void {}

  public getJSON(): Observable<any> {
    return this.http.get('../assets/checkins.json');
  }

// getRating() return rating from 0-5
}
