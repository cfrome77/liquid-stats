import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DataService } from 'src/app/core/services/data.service';
import { DateUtils } from 'src/app/core/utils/date-utils';

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrls: ['./badges.component.css']
})
export class BadgesComponent implements OnInit {
  public badges: any[] = [];
  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public totalItems!: number;
  public paginatedBadges: any[] = [];
  username: string;

  constructor(private dataService: DataService) {
    this.username = environment.untappdUsername;
  }

  ngOnInit(): void {
    this.dataService.getBadges().subscribe({
      next: (data) => {
        this.badges = data;
        this.totalItems = data.length;
        this.updatePagination();
      },
      error: (err) => {
        console.error('Error fetching badges:', err);
      },
      complete: () => {
        console.log('Badges fetch completed');
      }
    });
  }

  // Transform badge data into what your shared-card expects
  public transformBadgeData(badge: any): any {
    return {
      title: badge.badge_name,
      description: badge.badge_description,
      hint: badge.badge_hint,
      mainImage: badge.media.badge_image_sm,
      footerInfo: {
        timestamp: this.published(badge.earned_at),
        link: `https://untappd.com/user/${this.username}/badges/${badge.user_badge_id}`,
        text: 'Badge Page'
      },
      extraData: {
        // more optional data if needed
      }
    };
  }

  public published(createdAt: string): string {
    return DateUtils.formatDate(createdAt, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  public updatePagination(): void {
    const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedBadges = this.badges.slice(start, end);
  }

  public onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  public onItemsPerPageChange(value: number): void {
    this.itemsPerPage = value;
    this.updatePagination();
  }
}
