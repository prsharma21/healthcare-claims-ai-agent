import type { Claim, ClaimDateRange, ClaimFilters } from "@/types/claim";

import { daysBetween, parseDate } from "./date";

export const defaultClaimFilters: ClaimFilters = {
  search: "",
  status: "ALL",
  payerId: "ALL",
  providerId: "ALL",
  risk: "ALL",
  dateRange: "ALL",
};

const maxAgeInDays: Record<Exclude<ClaimDateRange, "ALL">, number> = {
  TODAY: 0,
  LAST_7_DAYS: 6,
  LAST_30_DAYS: 29,
};

/** Filters claims by free-text search (claim ID, patient, provider) and the dropdown filters. */
export function applyClaimFilters(claims: Claim[], filters: Partial<ClaimFilters>, now: Date = new Date()): Claim[] {
  const merged: ClaimFilters = { ...defaultClaimFilters, ...filters };
  const search = merged.search.trim().toLowerCase();

  return claims.filter((claim) => {
    if (search) {
      const haystack = [claim.id, claim.patientName, claim.patientId, claim.providerName, claim.providerId]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (merged.status !== "ALL" && claim.status !== merged.status) return false;
    if (merged.payerId !== "ALL" && claim.payerId !== merged.payerId) return false;
    if (merged.providerId !== "ALL" && claim.providerId !== merged.providerId) return false;
    if (merged.risk !== "ALL" && claim.riskLevel !== merged.risk) return false;
    if (merged.dateRange !== "ALL") {
      const age = daysBetween(now, parseDate(claim.submittedAt));
      if (age > maxAgeInDays[merged.dateRange]) return false;
    }
    return true;
  });
}

export function countActiveFilters(filters: ClaimFilters): number {
  return (Object.keys(defaultClaimFilters) as (keyof ClaimFilters)[]).filter(
    (key) => filters[key] !== defaultClaimFilters[key],
  ).length;
}
