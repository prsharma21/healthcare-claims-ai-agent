const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Parses ISO strings. Date-only values (yyyy-mm-dd) are treated as local dates, not UTC midnight. */
export function parseDate(value: string): Date {
  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / msPerDay);
}

/** ISO timestamp for a time of day, `days` days before now. Keeps mock data looking recent. */
export function daysAgoAt(days: number, hours: number, minutes: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() > Date.now()) {
    date.setTime(Date.now() - (days + 1) * 60 * 60 * 1000);
  }
  return date.toISOString();
}

export function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export function addMs(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString();
}
