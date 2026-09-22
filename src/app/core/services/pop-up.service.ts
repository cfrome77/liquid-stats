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
    logo?: string,
    totalCheckins?: number,
  ): string {
    const logoHtml = logo
      ? `<img src="${logo}" class="popup-brewery-logo" alt="${brewery_name}" width="36" height="36" style="border-radius: 6px; object-fit: contain; margin-right: 8px; flex-shrink: 0;" />`
      : "";
    const location = [brewery_city, brewery_state].filter(Boolean).join(", ");
    const checkinHtml =
      totalCheckins !== undefined
        ? `<div style="font-size: 0.8rem; opacity: 0.85; margin-top: 4px; color: var(--text-color, #333);">Total Check-ins: <strong>${totalCheckins}</strong></div>`
        : "";

    return (
      `<div class="map-popup-container" style="display: flex; align-items: center; font-family: inherit; padding: 2px;">` +
      `${logoHtml}` +
      `<div>` +
      `<strong style="font-size: 0.95rem; display: block; line-height: 1.2; color: var(--header-text, #111);">${brewery_name}</strong>` +
      `<div style="font-size: 0.8rem; opacity: 0.8; color: var(--text-color, #444);">${location}</div>` +
      `${checkinHtml}` +
      `</div>` +
      `</div>`
    );
  }
}
