import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css']
})
export class RatingComponent {
  @Input() ratingScore: number = 0; // Default rating score is 0

  get starPercentage(): number {
    return (this.ratingScore / 5) * 100;
  }
}