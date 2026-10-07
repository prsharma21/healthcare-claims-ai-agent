import { daysBetween, parseDate } from "./date";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const timeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const shortTimeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });

/** 45000 -> "₹45,000" */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

/** 1248 -> "1,248" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** "2026-09-20" -> "20 Sep 2026" */
export function formatDate(value: string): string {
  return dateFormatter.format(parseDate(value));
}

/** "2026-09-20" -> "20 Sep" */
export function formatDayMonth(value: string): string {
  return dayMonthFormatter.format(parseDate(value));
}

/** ISO timestamp -> "20 Sep 2026, 09:12" */
export function formatDateTime(value: string): string {
  const date = parseDate(value);
  return `${dateFormatter.format(date)}, ${shortTimeFormatter.format(date)}`;
}

/** ISO timestamp -> "09:12:04" */
export function formatTime(value: string): string {
  return timeFormatter.format(parseDate(value));
}

/** "Today", "Yesterday", "3 days ago" or a date for older values. */
export function formatRelativeDay(value: string, now: Date = new Date()): string {
  const diff = daysBetween(now, parseDate(value));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return formatDate(value);
}

/** ISO timestamp -> "4 min ago" */
export function formatRelativeTime(value: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - parseDate(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return formatRelativeDay(value, now);
}

/** 1800 -> "1.8 sec", 138000 -> "2m 18s" */
export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} sec`;
  return formatSeconds(Math.round(ms / 1000));
}

/** 138 -> "2m 18s" */
export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/** 0.94 -> "94%" */
export function formatPercent(fraction: number, fractionDigits = 0): string {
  return `${(fraction * 100).toFixed(fractionDigits)}%`;
}

/** 2_411_520 -> "2.3 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 142 -> "142 ms" */
export function formatLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

/** "REQUEST_INFORMATION" -> "Request Information" */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
