import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css']
})
export class RatingComponent {
  @Input() ratingScore: number | null = null;

  // Unique ID to avoid clipPath conflicts across component instances
  uniqueId = Math.random().toString(36).substring(2, 9);

  get hasRating(): boolean {
    return typeof this.ratingScore === 'number' && this.ratingScore > 0;
  }

  get starFills(): number[] {
    if (!this.hasRating) {
      return [];
    }

    const fills: number[] = [];

    for (let i = 0; i < 5; i++) {
      const starValue = i + 1;
      if (this.ratingScore! >= starValue) {
        fills.push(100); // full star
      } else if (this.ratingScore! + 1 > starValue) {
        const fill = (this.ratingScore! - i) * 100;
        fills.push(Math.round(fill));
      } else {
        fills.push(0); // empty star
      }
    }

    return fills;
  }
}
