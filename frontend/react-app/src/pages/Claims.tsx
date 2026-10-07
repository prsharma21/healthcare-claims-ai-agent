import { useState } from "react";
import { SearchX, Upload } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ClaimFiltersBar } from "@/components/claims/ClaimFiltersBar";
import { ClaimTable } from "@/components/claims/ClaimTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAsync } from "@/hooks/useAsync";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { claimsService } from "@/services/claimsService";
import { CLAIM_STATUSES, RISK_LEVELS, type ClaimDateRange, type ClaimFilters, type ClaimStatus, type RiskLevel } from "@/types/claim";
import { applyClaimFilters, countActiveFilters, defaultClaimFilters } from "@/utils/claimFilters";

const DATE_RANGES: ClaimDateRange[] = ["ALL", "TODAY", "LAST_7_DAYS", "LAST_30_DAYS"];

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Filters live in the URL so links like /claims?status=APPROVED work and survive reloads. */
function readFilters(params: URLSearchParams): ClaimFilters {
  return {
    search: params.get("q") ?? "",
    status: pick<ClaimStatus | "ALL">(params.get("status"), ["ALL", ...CLAIM_STATUSES], "ALL"),
    payerId: params.get("payer") ?? "ALL",
    providerId: params.get("provider") ?? "ALL",
    risk: pick<RiskLevel | "ALL">(params.get("risk"), ["ALL", ...RISK_LEVELS], "ALL"),
    dateRange: pick(params.get("date"), DATE_RANGES, "ALL"),
  };
}

function writeFilters(filters: ClaimFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (filters.payerId !== "ALL") params.set("payer", filters.payerId);
  if (filters.providerId !== "ALL") params.set("provider", filters.providerId);
  if (filters.risk !== "ALL") params.set("risk", filters.risk);
  if (filters.dateRange !== "ALL") params.set("date", filters.dateRange);
  return params;
}

export default function Claims() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const debouncedSearch = useDebouncedValue(filters.search, 200);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const claims = useAsync(() => claimsService.getClaims());
  const referenceData = useAsync(() => claimsService.getReferenceData());

  const updateFilters = (changes: Partial<ClaimFilters>) => {
    setSearchParams(writeFilters({ ...filters, ...changes }), { replace: true });
    setPage(1);
  };

  const effectiveFilters = { ...filters, search: debouncedSearch };
  const filteredClaims = applyClaimFilters(claims.data ?? [], effectiveFilters);

  // Counts for the status chips ignore the status filter itself.
  const claimsForCounts = applyClaimFilters(claims.data ?? [], { ...effectiveFilters, status: "ALL" });
  const statusCounts = { ALL: claimsForCounts.length } as Record<ClaimStatus | "ALL", number>;
  for (const status of CLAIM_STATUSES) {
    statusCounts[status] = claimsForCounts.filter((claim) => claim.status === status).length;
  }

  const totalPages = Math.max(1, Math.ceil(filteredClaims.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageClaims = filteredClaims.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterCount = countActiveFilters(filters);

  return (
    <>
      <PageHeader
        title="Claims"
        description="Search, filter and process healthcare claims."
        actions={
          <Button asChild>
            <Link to="/upload">
              <Upload aria-hidden="true" /> Upload Claim
            </Link>
          </Button>
        }
      />

      <Card>
        <ClaimFiltersBar
          filters={filters}
          onChange={updateFilters}
          onReset={() => {
            setSearchParams(writeFilters(defaultClaimFilters), { replace: true });
            setPage(1);
          }}
          activeCount={activeFilterCount}
          statusCounts={statusCounts}
          referenceData={referenceData.data}
        />

        {claims.error ? (
          <ErrorState title="Unable to load claims." error={claims.error} onRetry={claims.reload} />
        ) : !claims.data ? (
          <LoadingState message="Loading claims..." rows={6} />
        ) : (
          <>
            <ClaimTable
              caption="Claims matching the current filters"
              claims={pageClaims}
              columns={["id", "patient", "provider", "diagnosis", "procedure", "amount", "payer", "risk", "status", "actions"]}
              onView={(claim) => navigate(`/claims/${claim.id}`)}
              onProcess={(claim) => navigate(`/claims/${claim.id}?tab=ai-processing&process=1`)}
              emptyState={
                <EmptyState
                  icon={SearchX}
                  title="No claims found."
                  description="No claims match the current search and filters."
                  action={
                    activeFilterCount > 0 ? (
                      <Button variant="outline" size="sm" onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}>
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
            {filteredClaims.length > 0 && (
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={filteredClaims.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                itemLabel="claims"
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
