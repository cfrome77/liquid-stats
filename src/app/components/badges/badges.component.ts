import { Component, OnInit, ChangeDetectorRef, inject } from "@angular/core";

import { MatDialogModule } from "@angular/material/dialog";
import { DataService } from "src/app/core/services/data.service";
import { Badge } from "src/app/core/models/badge.model";
import { LoggingService } from "src/app/core/services/logger.service";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";
import { CardComponent } from "../../shared/components/card/card.component";
import { BaseCardData } from "../../shared/components/card/card-data.interface";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-badges",
  templateUrl: "./badges.component.html",
  styleUrls: ["./badges.component.css"],
  standalone: true,
  imports: [MatDialogModule, PaginationComponent, CardComponent],
})
export class BadgesComponent implements OnInit {
  private dataService = inject(DataService);
  private logger = inject(LoggingService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  public badges: Badge[] = [];
  public paginatedBadges: Badge[] = [];

  public currentPage = 1;
  public itemsPerPage = 10;
  public totalItems = 0;

  ngOnInit(): void {
    this.dataService.getBadges().subscribe({
      next: (data: Badge[]) => {
        this.badges = data;
        this.totalItems = this.badges.length;
        this.updatePagination();
      },
      error: (err: unknown) => {
        this.logger.error("Error fetching badges", err);
      },
    });
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBadges = this.badges.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  onItemsPerPageChange(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.updatePagination();
  }

  transformBadgeData(badge: Badge): BaseCardData {
    const dateObj = new Date(badge.earned_at);
    const formattedDate = dateObj.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return {
      title: badge.badge_name,
      // We wrap the description in the sanitizer and move it to the description field
      // This allows <a> and <strong> tags to work and better utilizes card space
      description: this.sanitizer.bypassSecurityTrustHtml(
        badge.badge_description,
      ) as unknown as string,
      mainImage: badge.media.badge_image_sm,
      footerInfo: {
        text: `Earned: ${formattedDate}`,
        link: undefined,
        timestamp: formattedDate,
      },
    };
  }
}
