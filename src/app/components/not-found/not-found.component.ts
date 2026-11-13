import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";

import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <div class="main-content-container">
      <app-empty-state
        icon="explore_off"
        message="We couldn't find that page. It may have been moved or the link is incorrect."
        buttonText="Back to Home"
        (action)="goHome()"
      ></app-empty-state>
    </div>
  `,
})
export class NotFoundComponent {
  private router = inject(Router);

  goHome(): void {
    this.router.navigate(["/"]);
  }
}
