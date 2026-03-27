import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer } from "@angular/platform-browser";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-social-links",
  templateUrl: "./social-links.component.html",
  styleUrls: ["./social-links.component.css"],
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
})
export class SocialLinksComponent implements OnInit {
  constructor(
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
  ) {
    this.iconRegistry.addSvgIcon(
      "instagram",
      this.sanitizer.bypassSecurityTrustResourceUrl(
        "assets/icons/instagram.svg",
      ),
    );
  }

  ngOnInit(): void {}

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
}
