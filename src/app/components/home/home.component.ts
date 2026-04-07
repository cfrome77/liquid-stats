import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  inject,
} from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

import { DataService } from "../../core/services/data.service";
import { Checkin, CheckinResponse } from "../../core/models/checkin.model";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
  ],
})
export class HomeComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild("carouselTrack") carouselTrack!: ElementRef;

  allCheckins: Checkin[] = [];
  totalCheckins = 0;
  averageRating = 0;
  countriesTried = 0;
  breweriesVisited = 0;

  readonly DEFAULT_IMAGE =
    "https://placehold.co/400x400/2c2c2c/white?text=No+Photo";

  ngOnInit(): void {
    // 1. Fetch Stats
    this.dataService.getStats().subscribe({
      next: (res: unknown) => {
        const stats = res as {
          totalCheckins?: number;
          averageRating?: number;
          countriesTried?: number;
          breweriesVisited?: number;
        };
        this.totalCheckins = stats?.totalCheckins || 0;
        this.averageRating = stats?.averageRating || 0;
        this.countriesTried = stats?.countriesTried || 0;
        this.breweriesVisited = stats?.breweriesVisited || 0;
        this.cdr.detectChanges();
      },
    });

    // 2. Fetch Checkins (Full list for the scrollable track)
    this.dataService.getCheckins().subscribe({
      next: (res: CheckinResponse) => {
        this.allCheckins = res?.response?.checkins?.items || [];
        this.cdr.detectChanges();
      },
    });
  }

  // --- Native Scroll Controls ---
  scrollNext() {
    const track = this.carouselTrack.nativeElement;
    // Scrolls by the visible width of the container
    track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
  }

  scrollPrev() {
    const track = this.carouselTrack.nativeElement;
    track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
  }

  handleImageError(event: Event) {
    (event.target as HTMLImageElement).src = this.DEFAULT_IMAGE;
  }
}
