import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PopUpService {

  constructor() { }

  makePopup(brewery_name: any, brewery_state: any, brewery_city: any): string {
    console.log(brewery_name);
    console.log(brewery_city);
    console.log(brewery_state);
    return `` +
      `<div>${ brewery_name }</div>` +
      `<div>${ brewery_city } ${ brewery_state}</div>`;
  }
}
