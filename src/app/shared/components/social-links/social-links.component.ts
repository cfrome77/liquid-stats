import { Component, Input, inject } from "@angular/core";

import { DomSanitizer } from "@angular/platform-browser";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-social-links",
  templateUrl: "./social-links.component.html",
  styleUrls: ["./social-links.component.css"],
  standalone: true,
  imports: [MatIconModule, RouterModule],
})
export class SocialLinksComponent {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  @Input() contact!: {
    url?: string;
    facebook?: string;
    instagram?: string;
  };

  @Input() mapData:
    | {
        lat: number;
        lng: number;
        breweryId: string;
      }
    | undefined;

  constructor() {
    this.iconRegistry.addSvgIcon(
      "instagram",
      this.sanitizer.bypassSecurityTrustResourceUrl(
        "assets/icons/instagram.svg",
      ),
    );
  }
}
