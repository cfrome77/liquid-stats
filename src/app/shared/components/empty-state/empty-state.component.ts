import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-empty-state",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon }}</mat-icon>
      <p>{{ message }}</p>
      @if (buttonText) {
        <button mat-stroked-button (click)="action.emit()">
          {{ buttonText }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 1rem;
        text-align: center;
        color: var(--text-color);
        opacity: 0.7;
      }

      .empty-state mat-icon {
        font-size: 5rem;
        width: 5rem;
        height: 5rem;
        margin-bottom: 1.5rem;
        color: var(--accent-blue);
        opacity: 0.5;
      }

      .empty-state p {
        font-size: 1.25rem;
        margin-bottom: 2rem;
        font-weight: 500;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon: string = "search_off";
  @Input() message: string = "No items found.";
  @Input() buttonText: string | null = null;
  @Output() action = new EventEmitter<void>();
}
