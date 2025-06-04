import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import { StatsService } from './stats.service';
import { BeerCheckin, ProcessedStats } from './stats.model';
import { BeerStyleDialogComponent } from '../../shared/components/beer-style-dialog/beer-style-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  beers: BeerCheckin[] = [];
  processedStats: ProcessedStats | null = null;

  dateRange = new FormControl('year');
  customStartDate = new FormControl(moment().subtract(1, 'year').format('YYYY-MM-DD'));
  customEndDate = new FormControl(moment().format('YYYY-MM-DD'));

  constructor(private statsService: StatsService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadBeerData();

    this.dateRange.valueChanges.subscribe(() => this.onDateChange());
    this.customStartDate.valueChanges.subscribe(() => this.onDateChange());
    this.customEndDate.valueChanges.subscribe(() => this.onDateChange());
  }

  loadBeerData(): void {
    this.statsService.loadBeerData().subscribe((data: BeerCheckin[]) => {
      this.beers = data;
      this.onDateChange();
    });
  }

  onDateChange(): void {
    if (!this.beers || this.beers.length === 0) {
      console.warn('No beers loaded yet.');
      this.processedStats = null;
      return;
    }

    const rangeType = this.dateRange.value;
    let rangeStart: Date;
    let rangeEnd: Date;

    if (rangeType === 'custom') {
      if (!this.customStartDate.value || !this.customEndDate.value) {
        console.warn('Custom dates are missing');
        this.processedStats = null;
        return;
      }
      rangeStart = new Date(this.customStartDate.value);
      rangeEnd = new Date(this.customEndDate.value);
    } else {
      const now = new Date();
      switch (rangeType) {
        case 'week':
          rangeStart = moment(now).subtract(7, 'days').toDate();
          rangeEnd = now;
          break;
        case 'month':
          rangeStart = moment(now).subtract(1, 'month').toDate();
          rangeEnd = now;
          break;
        case 'year':
          rangeStart = moment(now).subtract(1, 'year').toDate();
          rangeEnd = now;
          break;
        case 'all':
        default:
          rangeStart = new Date('2000-01-01');
          rangeEnd = now;
          break;
      }
    }

    const stats = this.statsService.computeStats(this.beers, rangeStart, rangeEnd);

    // Recompute beerStylesCount with consistent normalization
    const counts: { [style: string]: number } = {};
    const normalizeStyle = (s: string): string => s.trim().toLowerCase();
    for (const beer of this.beers) {
      const date = new Date(beer.recent_created_at);
      if (date < rangeStart || date > rangeEnd) continue;

      const style = normalizeStyle(beer.beer.beer_style);
      counts[style] = (counts[style] || 0) + 1;
    }

    // Assign processedStats safely (Option 1)
    this.processedStats = {
      totalUniqueBeers: stats.totalUniqueBeers ?? 0,
      totalCheckins: stats.totalCheckins ?? 0,
      newBeersCount: stats.newBeersCount ?? 0,
      newBeerRatio: stats.newBeerRatio ?? 0,
      averageRating: stats.averageRating ?? 0,
      totalUniqueBreweries: stats.totalUniqueBreweries ?? 0,
      beerStylesCount: counts
    };
  }

  beerStylesList(): string[] {
    return Object.keys(this.processedStats?.beerStylesCount || {}).sort(
      (a, b) => (this.processedStats!.beerStylesCount[b] - this.processedStats!.beerStylesCount[a])
    );
  }

  getStartDate(): Date | null {
    const range = this.dateRange.value;
    const now = new Date();

    switch (range) {
      case 'week': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      case 'month': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case 'year': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      case 'custom': return this.customStartDate.value ? new Date(this.customStartDate.value) : null;
      case 'all':
      default:
        return null;
    }
  }

  getEndDate(): Date | null {
    const range = this.dateRange.value;
    return (range === 'custom' && this.customEndDate.value)
      ? new Date(this.customEndDate.value)
      : new Date();
  }

  openBeerStyleDialog(style: string) {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    const normalizeStyle = (s: string): string => s.trim().toLowerCase();

    const filteredBeers = this.beers.filter(b => {
      const beerStyle = normalizeStyle(b.beer.beer_style);
      const selectedStyle = normalizeStyle(style);
      const checkInDate = new Date(b.recent_created_at);

      return (
        beerStyle === selectedStyle &&
        (!startDate || !endDate || (checkInDate >= startDate && checkInDate <= endDate))
      );
    });

    this.dialog.open(BeerStyleDialogComponent, {
      data: {
        styleName: style,
        beers: filteredBeers.map(b => ({
          beerName: b.beer.beer_name,
          beerLabel: b.beer.beer_label || 'https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png',
          breweryName: b.brewery.brewery_name,
          beerABV: b.beer.beer_abv,
          rating: b.rating_score,
          checkInDate: b.recent_created_at ? new Date(b.recent_created_at).toLocaleString() : 'Unknown Date'
        }))
      }
    });
  }
}
