import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PopUpService {
  constructor() {}

  makePopup(
    brewery_name: string,
    brewery_state: string,
    brewery_city: string,
  ): string {
    return (
      `` +
      `<div>${brewery_name}</div>` +
      `<div>${brewery_city} ${brewery_state}</div>`
    );
  }
}
