import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { DataService } from "src/app/core/services/data.service";
import { Badge } from "src/app/core/models/badge.model";
import { LoggingService } from "src/app/core/services/logger.service";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";
import { CardComponent } from "../../shared/components/card/card.component";
import { BaseCardData } from "../../shared/components/card/card-data.interface";

@Component({
  selector: "app-badges",
  templateUrl: "./badges.component.html",
  styleUrls: ["./badges.component.css"],
  standalone: true,
  imports: [CommonModule, MatDialogModule, PaginationComponent, CardComponent],
})
export class BadgesComponent implements OnInit {
  public badges: Badge[] = [];
  public paginatedBadges: Badge[] = [];

  public currentPage = 1;
  public itemsPerPage = 10;
  public totalItems = 0;

  constructor(
    private dataService: DataService,
    private logger: LoggingService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dataService.getBadges().subscribe({
      next: (data: any) => {
        this.badges = data;
        this.totalItems = this.badges.length;
        this.updatePagination();
      },
      error: (err: any) => {
        this.logger.error(err);
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
    return {
      title: badge.badge_name,
      subtitle: badge.badge_description,
      mainImage: badge.media.badge_image_sm,
      footerInfo: {
        text: `Earned: ${badge.earned_at}`,
        link: undefined,
        timestamp: badge.earned_at
      }
    };
  }
}
