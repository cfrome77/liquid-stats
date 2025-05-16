import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css']
})
export class RatingComponent {
  @Input() ratingScore: number = 0;

  get starFills(): number[] {
    const fills: number[] = [];

    for (let i = 0; i < 5; i++) {
      const starValue = i + 1;
      if (this.ratingScore >= starValue) {
        fills.push(100); // full star
      } else if (this.ratingScore + 1 > starValue) {
        const rawFill = (this.ratingScore - i) * 100;

        // Clamp fill to a min of 15% if greater than 0
        const visibleFill = rawFill > 0 && rawFill < 15 ? 15 : rawFill < 100 && rawFill > 85 ? 85 : rawFill;

        fills.push(Math.round(visibleFill));
      } else {
        fills.push(0);
      }
    }
    
    return fills;
  }
}
