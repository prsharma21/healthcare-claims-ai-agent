import { ClaimStatusBadge } from "@/components/claims/ClaimStatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { HistoricalClaim } from "@/types/claim";
import { formatCurrency, formatDate } from "@/utils/format";

interface FraudHistoryTableProps {
  claims: HistoricalClaim[];
  matchingClaimId: string | null;
}

export function FraudHistoryTable({ claims, matchingClaimId }: FraudHistoryTableProps) {
  return (
    <DataTable
      caption="Historical claims for this patient"
      rows={claims}
      getRowId={(claim) => claim.claimId}
      isRowHighlighted={(claim) => claim.claimId === matchingClaimId}
      emptyState={<EmptyState title="No historical claims." description="This patient has no previous claims on record." />}
      columns={[
        { id: "id", header: "Claim ID", cell: (claim) => <span className="font-mono text-[13px] font-semibold">{claim.claimId}</span> },
        { id: "date", header: "Date of Service", cell: (claim) => formatDate(claim.dateOfService) },
        { id: "procedure", header: "Procedure", cell: (claim) => <span className="font-mono text-xs">{claim.procedureCode}</span> },
        { id: "amount", header: "Amount", align: "right", cell: (claim) => <span className="tabular-nums">{formatCurrency(claim.amount)}</span> },
        { id: "status", header: "Status", cell: (claim) => <ClaimStatusBadge status={claim.status} /> },
        {
          id: "match",
          header: "Match",
          cell: (claim) =>
            claim.claimId === matchingClaimId ? (
              <StatusBadge label="Duplicate match" tone="danger" />
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        },
      ]}
    />
  );
}
