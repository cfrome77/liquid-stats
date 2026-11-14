import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";

import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

/**
 * Generic placeholder for a region with no content. Use `variant="error"`
 * to signal a failed load (warning styling) instead of a genuine empty result.
 */
@Component({
  selector: "app-empty-state",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div
      class="empty-state"
      [class.error]="variant === 'error'"
      [attr.role]="variant === 'error' ? 'alert' : 'status'"
      aria-live="polite"
    >
      <mat-icon aria-hidden="true">{{ icon }}</mat-icon>
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

      .empty-state.error mat-icon {
        color: var(--btn-danger, #f44336);
        opacity: 0.7;
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
  @Input() icon = "search_off";
  @Input() message = "No items found.";
  @Input() buttonText: string | null = null;
  @Input() variant: "empty" | "error" = "empty";
  @Output() action = new EventEmitter<void>();
}
