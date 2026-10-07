import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import type { ReferenceData } from "@/services/claimsService";
import { CLAIM_STATUSES, RISK_LEVELS, type ClaimDateRange, type ClaimFilters, type ClaimStatus, type RiskLevel } from "@/types/claim";
import { claimStatusMeta, riskMeta } from "@/utils/status";

interface ClaimFiltersBarProps {
  filters: ClaimFilters;
  onChange: (changes: Partial<ClaimFilters>) => void;
  onReset: () => void;
  activeCount: number;
  statusCounts: Record<ClaimStatus | "ALL", number>;
  referenceData: ReferenceData | undefined;
}

const dateRanges: { value: ClaimDateRange; label: string }[] = [
  { value: "ALL", label: "Any time" },
  { value: "TODAY", label: "Today" },
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "LAST_30_DAYS", label: "Last 30 days" },
];

export function ClaimFiltersBar({ filters, onChange, onReset, activeCount, statusCounts, referenceData }: ClaimFiltersBarProps) {
  const statusOptions: (ClaimStatus | "ALL")[] = ["ALL", ...CLAIM_STATUSES];

  return (
    <div className="flex flex-col gap-3 border-b p-4">
      <div role="group" aria-label="Filter by status" className="flex gap-1.5 overflow-x-auto pb-1">
        {statusOptions.map((status) => {
          const active = filters.status === status;
          const label = status === "ALL" ? "All" : claimStatusMeta[status].label;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ status })}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
                active ? "border-primary bg-blue-50 text-primary" : "border-border bg-card text-slate-600 hover:bg-muted",
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-sm px-1 text-[10px] tabular-nums",
                  active ? "bg-primary text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {statusCounts[status]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_repeat(4,minmax(130px,1fr))_auto] lg:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="claim-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="claim-search"
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Claim ID, patient or provider"
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-payer">Payer</Label>
          <NativeSelect id="filter-payer" value={filters.payerId} onChange={(event) => onChange({ payerId: event.target.value })}>
            <option value="ALL">All payers</option>
            {referenceData?.payers.map((payer) => (
              <option key={payer.id} value={payer.id}>
                {payer.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-provider">Provider</Label>
          <NativeSelect
            id="filter-provider"
            value={filters.providerId}
            onChange={(event) => onChange({ providerId: event.target.value })}
          >
            <option value="ALL">All providers</option>
            {referenceData?.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-risk">AI Risk</Label>
          <NativeSelect
            id="filter-risk"
            value={filters.risk}
            onChange={(event) => onChange({ risk: event.target.value as RiskLevel | "ALL" })}
          >
            <option value="ALL">All risk levels</option>
            {RISK_LEVELS.map((risk) => (
              <option key={risk} value={risk}>
                {riskMeta[risk].label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-date">Submitted</Label>
          <NativeSelect
            id="filter-date"
            value={filters.dateRange}
            onChange={(event) => onChange({ dateRange: event.target.value as ClaimDateRange })}
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <Button variant="ghost" onClick={onReset} disabled={activeCount === 0} className="justify-self-start">
          <X aria-hidden="true" />
          Clear{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>
    </div>
  );
}
