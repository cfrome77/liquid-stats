import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import { StatsService } from './stats.service';
import { BeerCheckin, ProcessedStats } from './stats.model';
import { BeerStyleDialogComponent, GenericBeersDialogData } from '../../shared/components/beer-style-dialog/beer-style-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ChartData } from 'chart.js';

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

  hourChartLabels: string[] = Array.from({ length: 24 }, (_, i) => i.toString());
  hourChartData: ChartData<'bar', number[], string> = {
    labels: this.hourChartLabels,
    datasets: [
      {
        label: 'Check-ins by Hour',
        data: [],
        backgroundColor: 'rgba(63,81,181,0.8)'
      }
    ]
  };

  recentActivityChartLabels: string[] = [];
  recentActivityChartData?: ChartData<'line', number[], string>;
  checkinsByDayLabels: string[] = [];
  dayChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  monthChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  ratingChartData: ChartData<'line'> = { labels: [], datasets: [] };

  chartOptions = { responsive: true, maintainAspectRatio: false };

  objectKeys = Object.keys;

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
    try { // ADDED: try-catch block to catch any runtime errors
      if (!this.beers || this.beers.length === 0) {
        console.warn('No beers loaded yet.');
        this.processedStats = null;
        this.clearChartData();
        return;
      }

      const rangeType = this.dateRange.value;
      let rangeStart: Date;
      let rangeEnd: Date;

      if (rangeType === 'custom') {
        if (!this.customStartDate.value || !this.customEndDate.value) {
          console.warn('Custom dates are missing');
          this.processedStats = null;
          this.clearChartData();
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

      this.processedStats = {
        totalUniqueBeers: stats.totalUniqueBeers ?? 0,
        totalCheckins: stats.totalCheckins ?? 0,
        newBeersCount: stats.newBeersCount ?? 0,
        newBeerRatio: stats.newBeerRatio ?? 0,
        averageRating: stats.averageRating ?? 0,
        totalUniqueBreweries: stats.totalUniqueBreweries ?? 0,
        beerStylesCount: stats.beerStylesCount ?? {},
        topBeers: stats.topBeers ?? [],
        topCountries: stats.topCountries ?? {},
        topStates: stats.topStates ?? {},
        recentActivityByDate: stats.recentActivityByDate ?? [],
        checkinsByHour: stats.checkinsByHour ?? [],
        checkinsByDay: stats.checkinsByDay ?? [],
        checkinsByDayOfWeek: stats.checkinsByDayOfWeek ?? [],
        checkinsByMonth: stats.checkinsByMonth ?? [],
        averageRatingsOverTime: stats.averageRatingsOverTime ?? []
      };
      
      // Chart: Check-ins by Hour
      this.hourChartData = {
        labels: this.hourChartLabels,
        datasets: [
          {
            data: this.processedStats.checkinsByHour,
            label: 'Check-ins by Hour',
            backgroundColor: 'rgba(63,81,181,0.8)'
          }
        ]
      };

      // Chart: Recent Activity (Line Chart)
      this.recentActivityChartLabels = this.processedStats.recentActivityByDate.map(d => d.date);
      this.recentActivityChartData = {
        labels: this.recentActivityChartLabels,
        datasets: [
          {
            data: this.processedStats.recentActivityByDate.map(d => d.count),
            label: 'Beers Checked In',
            fill: false,
            borderColor: 'rgba(255,235,59,0.9)',
            tension: 0.3
          }
        ]
      };

      // Chart: Check-ins by Day (Bar Chart, last 7 days)
      this.checkinsByDayLabels = this.generateLastNDaysLabels(7);
      const checkinsCountByDayMap = new Map(
        this.processedStats.checkinsByDay.map(d => [d.date, d.count])
      );
      const checkinsData = this.checkinsByDayLabels.map(label => {
        const labelDate = moment(label, 'MMM D').year(moment().year()).format('YYYY-MM-DD');
        return checkinsCountByDayMap.get(labelDate) || 0;
      });

      // Chart: Check-ins by Day of Week
      const dayOfWeekLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeekCounts = new Array(7).fill(0);

      this.processedStats.checkinsByDayOfWeek?.forEach(item => {
        const index = dayOfWeekLabels.indexOf(item.day);
        if (index !== -1) {
          dayOfWeekCounts[index] = item.count;
        }
      });

      this.dayChartData = {
        labels: dayOfWeekLabels,
        datasets: [
          {
            data: dayOfWeekCounts,
            label: 'Check-ins by Day of Week',
            backgroundColor: 'rgba(255,167,38,0.8)'
          }
        ]
      };

      // Chart: Check-ins by Month
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthCounts = new Array(12).fill(0);

      this.processedStats.checkinsByMonth?.forEach(item => {
        const index = monthLabels.indexOf(item.month);
        if (index !== -1) {
          monthCounts[index] = item.count;
        }
      });

      this.monthChartData = {
        labels: monthLabels,
        datasets: [
          {
            data: monthCounts,
            label: 'Check-ins by Month',
            backgroundColor: 'rgba(171,71,188,0.8)'
          }
        ]
      };

      // Chart: Average Ratings Over Time
      this.ratingChartData = {
        labels: this.processedStats.averageRatingsOverTime?.map(item => item.date) || [],
        datasets: [
          {
            data: this.processedStats.averageRatingsOverTime?.map(item => item.rating) || [],
            label: 'Average Rating',
            fill: false,
            borderColor: 'rgba(255,82,82,0.9)',
            tension: 0.2
          }
        ]
      };

    } catch (error) {
      console.error("!!! Error in onDateChange:", error); // Log any errors that occur
      this.processedStats = null; // Clear stats to indicate an issue
      this.clearChartData();      // Clear charts
    }
  }

  generateLastNDaysLabels(days: number): string[] {
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      labels.push(moment().subtract(i, 'days').format('MMM D'));
    }
    return labels;
  }

  private clearChartData(): void {
    this.hourChartData = { labels: this.hourChartLabels, datasets: [{ label: 'Check-ins by Hour', data: [], backgroundColor: 'rgba(63,81,181,0.8)' }] };
    this.recentActivityChartLabels = [];
    this.recentActivityChartData = undefined;
    this.checkinsByDayLabels = [];
    this.dayChartData = { labels: [], datasets: [] };
    this.monthChartData = { labels: [], datasets: [] };
    this.ratingChartData = { labels: [], datasets: [] };
  }


  beerStylesList(): string[] {
    return Object.keys(this.processedStats?.beerStylesCount || {}).sort(
      (a, b) => this.processedStats!.beerStylesCount[b] - this.processedStats!.beerStylesCount[a]
    );
  }

  getStartDate(): Date | null {
    const range = this.dateRange.value;
    const now = new Date();

    switch (range) {
      case 'week': return moment(now).subtract(7, 'days').toDate();
      case 'month': return moment(now).subtract(1, 'month').toDate();
      case 'year': return moment(now).subtract(1, 'year').toDate();
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

  private openGenericBeersDialog(title: string, filteredBeers: BeerCheckin[]): void {
    const dialogData: GenericBeersDialogData = {
      title: title,
      beers: filteredBeers.map(b => ({
        beerName: b.beer.beer_name,
        beerLabel: b.beer.beer_label || 'https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png',
        breweryName: b.brewery.brewery_name,
        beerABV: b.beer.beer_abv,
        rating: b.rating_score,
        checkInDate: b.recent_created_at ? new Date(b.recent_created_at).toLocaleString() : 'Unknown Date'
      }))
    };

    this.dialog.open(BeerStyleDialogComponent, {
      data: dialogData,
      width: '350px',
      maxHeight: '80vh'
    });
  }

  openBeersByStyle(style: string) {
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

    this.openGenericBeersDialog(`Beers with Style: ${style}`, filteredBeers);
  }

  openBeersByTopBeer(beerName: string): void {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    const filteredBeers = this.beers.filter(b => {
      const checkInDate = new Date(b.recent_created_at);
      return b.beer.beer_name === beerName &&
        (!startDate || !endDate || (checkInDate >= startDate && checkInDate <= endDate));
    });

    this.openGenericBeersDialog(`All Check-ins for: ${beerName}`, filteredBeers);
  }

  openBeersByCountry(country: string): void {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    const filteredBeers = this.beers.filter(b => {
      const checkInDate = new Date(b.recent_created_at);
      return b.brewery.country_name === country &&
        (!startDate || !endDate || (checkInDate >= startDate && checkInDate <= endDate));
    });

    this.openGenericBeersDialog(`Beers from: ${country}`, filteredBeers);
  }

  openBeersByState(state: string): void {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    const filteredBeers = this.beers.filter(b => {
      const checkInDate = new Date(b.recent_created_at);
      return b.brewery.location.brewery_state === state &&
        (!startDate || !endDate || (checkInDate >= startDate && checkInDate <= endDate));
    });

    this.openGenericBeersDialog(`Beers from: ${state}`, filteredBeers);
  }
}