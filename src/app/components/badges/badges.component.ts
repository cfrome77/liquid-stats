import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DateUtils } from 'src/app/shared/date-utils';

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

  constructor(private http: HttpClient) {
    this.username = environment.untappdUsername;
  }

  ngOnInit(): void {
    this.getJSON().subscribe((data) => {
      this.badges = data;
      this.totalItems = data.length;
      this.updatePagination();
    });
  }

  public getJSON(): Observable<any> {
    return this.http.get<any>('https://liquid-stats.s3.amazonaws.com/badges.json');
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
