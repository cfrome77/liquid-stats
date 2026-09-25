import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-skeleton-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./skeleton-card.component.html",
  styleUrls: ["./skeleton-card.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonCardComponent {
  viewMode = input<"cards" | "compact">("cards");
  count = input<number>(3);

  get items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
