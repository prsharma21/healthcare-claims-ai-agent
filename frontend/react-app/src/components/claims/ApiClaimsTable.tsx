import { Database, RefreshCw } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { appConfig } from "@/lib/config";
import { claimsApi } from "@/services/claimsService";
import type { ApiClaim } from "@/types/claimApi";
import { formatDateTime } from "@/utils/format";
import { apiClaimStatusMeta, apiClaimTypeLabels } from "@/utils/status";

const PAGE_SIZE = 10;

const columns: DataTableColumn<ApiClaim>[] = [
  {
    id: "id",
    header: "Claim ID",
    cell: (claim) => <span className="font-mono text-[13px] font-semibold">{claim.claim_id}</span>,
  },
  { id: "patient", header: "Patient", cell: (claim) => <span className="font-mono text-[13px]">{claim.patient_id ?? "—"}</span> },
  { id: "provider", header: "Provider", cell: (claim) => <span className="font-mono text-[13px]">{claim.provider_id ?? "—"}</span> },
  { id: "payer", header: "Payer", cell: (claim) => <span className="font-mono text-[13px]">{claim.payer_id ?? "—"}</span> },
  { id: "type", header: "Claim Type", cell: (claim) => (claim.claim_type ? apiClaimTypeLabels[claim.claim_type] : "—") },
  {
    id: "document",
    header: "Document",
    cell: (claim) => (
      <span title={claim.s3_object_key ? `s3://${claim.s3_bucket}/${claim.s3_object_key}` : "Not uploaded"}>
        {claim.document_name}
        {claim.s3_object_key && <span className="ml-1.5 text-[11px] font-medium text-green-700">S3</span>}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (claim) => <StatusBadge label={apiClaimStatusMeta[claim.status].label} tone={apiClaimStatusMeta[claim.status].tone} dot />,
  },
  {
    id: "created",
    header: "Created",
    cell: (claim) => <span className="text-muted-foreground">{formatDateTime(claim.created_at)}</span>,
  },
];

/** Claims stored by the FastAPI backend, read with GET /claims. */
export function ApiClaimsTable({ refreshKey }: { refreshKey: number }) {
  const claims = useAsync(() => claimsApi.listClaims({ limit: PAGE_SIZE }), [refreshKey]);
  const total = claims.data?.total ?? 0;

  return (
    <SectionCard
      title="Claims in the Claims API"
      description={`Most recent claims from GET /claims (${appConfig.apiBaseUrl})`}
      icon={Database}
      contentClassName="p-0"
      actions={
        <Button variant="outline" size="sm" onClick={claims.reload} disabled={claims.isLoading}>
          <RefreshCw className={claims.isLoading ? "animate-spin" : undefined} aria-hidden="true" /> Refresh
        </Button>
      }
    >
      {claims.error ? (
        <ErrorState title="Unable to load claims from the API." error={claims.error} onRetry={claims.reload} />
      ) : !claims.data ? (
        <LoadingState message="Loading claims..." rows={3} />
      ) : (
        <>
          <DataTable
            caption="Claims stored by the claims API"
            columns={columns}
            rows={claims.data.claims}
            getRowId={(claim) => claim.claim_id}
            emptyState={<EmptyState title="No claims created yet." description="Claims you create appear here." />}
          />
          {total > 0 && (
            <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
              Showing {claims.data.claims.length} of {total} claims
            </p>
          )}
        </>
      )}
    </SectionCard>
  );
}
