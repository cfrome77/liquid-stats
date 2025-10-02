// src/app/shared/date-utils.ts
export class DateUtils {
  // Parse a date string, number, or Date into a Date object
  static parseDate(date: string | number | Date): Date {
    if (date instanceof Date) return date;
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed;
    // Fallback for edge cases
    return new Date(Date.parse(date as string));
  }

  // Format a Date using Intl options
  static formatDate(
    date: string | Date,
    fmt: Intl.DateTimeFormatOptions = {},
  ): string {
    return new Date(date).toLocaleString("en-US", fmt);
  }

  // Get start of day
  static startOfDay(date: string | Date): Date {
    const d = DateUtils.parseDate(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Get end of day
  static endOfDay(date: string | Date): Date {
    const d = DateUtils.parseDate(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  // Add days to a date
  static addDays(date: string | Date, days: number): Date {
    const d = DateUtils.parseDate(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // Subtract days from a date
  static subtractDays(
    days: number,
    fromDate: string | Date = new Date(),
  ): Date {
    return DateUtils.addDays(fromDate, -days);
  }

  // Subtract months from a date
  static subtractMonths(
    months: number,
    fromDate: string | Date = new Date(),
  ): Date {
    const d = DateUtils.parseDate(fromDate);
    d.setMonth(d.getMonth() - months);
    return d;
  }

  // Get min date from an array
  static minDate(dates: (string | Date | number)[]): Date {
    return new Date(
      Math.min(...dates.map((d) => DateUtils.parseDate(d).getTime())),
    );
  }

  // Get max date from an array
  static maxDate(dates: (string | Date | number)[]): Date {
    return new Date(
      Math.max(...dates.map((d) => DateUtils.parseDate(d).getTime())),
    );
  }

  // Convert date to timestamp
  static toTimestamp(date: string | Date): number {
    return DateUtils.parseDate(date).getTime();
  }

  // Format as YYYY-MM-DD
  static toISODate(date: string | Date): string {
    return DateUtils.parseDate(date).toISOString().split("T")[0];
  }

  // Format a Date into a readable timestamp
  static formatTimestamp(date: string | Date): string {
    const d = DateUtils.parseDate(date);
    return d.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Filter dates within a start/end range
  static filterDatesInRange(
    dates: (string | Date | number)[],
    start: Date,
    end: Date,
  ): Date[] {
    const startTime = start.getTime();
    const endTime = end.getTime();
    return dates
      .map((d) => DateUtils.parseDate(d))
      .filter((d) => {
        const t = d.getTime();
        return t >= startTime && t <= endTime;
      });
  }
}
