import { Eye, Play } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Claim } from "@/types/claim";
import { formatCurrency, formatRelativeDay } from "@/utils/format";

import { ClaimStatusBadge } from "./ClaimStatusBadge";
import { RiskBadge } from "./RiskBadge";

export type ClaimColumnId =
  | "id"
  | "patient"
  | "provider"
  | "payer"
  | "diagnosis"
  | "procedure"
  | "amount"
  | "submitted"
  | "risk"
  | "status"
  | "actions";

interface ClaimTableProps {
  claims: Claim[];
  columns: ClaimColumnId[];
  onView: (claim: Claim) => void;
  onProcess?: (claim: Claim) => void;
  emptyState?: ReactNode;
  caption: string;
}

function buildColumns(onView: (claim: Claim) => void, onProcess?: (claim: Claim) => void): Record<ClaimColumnId, DataTableColumn<Claim>> {
  // With both buttons the table is too wide for typical desktops, so labels show only on very wide screens.
  const compactActions = Boolean(onProcess);
  return {
    id: {
      id: "id",
      header: "Claim ID",
      cell: (claim) => <span className="font-mono text-[13px] font-semibold text-primary">{claim.id}</span>,
    },
    patient: {
      id: "patient",
      header: "Patient",
      cell: (claim) => (
        <div className="leading-tight">
          <span className="block font-medium">{claim.patientName}</span>
          <span className="block text-xs text-muted-foreground">{claim.patientId}</span>
        </div>
      ),
    },
    provider: { id: "provider", header: "Provider", cell: (claim) => claim.providerName },
    payer: { id: "payer", header: "Payer", cell: (claim) => claim.payerName },
    diagnosis: {
      id: "diagnosis",
      header: "Diagnosis",
      cell: (claim) => (
        <div className="max-w-[130px] leading-tight">
          <span className="block font-mono text-xs font-semibold">{claim.diagnosisCode}</span>
          <span className="block truncate text-xs text-muted-foreground" title={claim.diagnosisDescription}>
            {claim.diagnosisName}
          </span>
        </div>
      ),
    },
    procedure: {
      id: "procedure",
      header: "Procedure",
      cell: (claim) => (
        <div className="max-w-[140px] leading-tight">
          <span className="block font-mono text-xs font-semibold">{claim.procedureCode}</span>
          <span className="block truncate text-xs text-muted-foreground" title={claim.procedureDescription}>
            {claim.procedureDescription}
          </span>
        </div>
      ),
    },
    amount: {
      id: "amount",
      header: "Amount",
      align: "right",
      cell: (claim) => <span className="font-medium tabular-nums">{formatCurrency(claim.amount)}</span>,
    },
    submitted: {
      id: "submitted",
      header: "Submitted",
      cell: (claim) => <span className="text-muted-foreground">{formatRelativeDay(claim.submittedAt)}</span>,
    },
    risk: { id: "risk", header: "AI Risk", cell: (claim) => <RiskBadge risk={claim.riskLevel} /> },
    status: { id: "status", header: "Status", cell: (claim) => <ClaimStatusBadge status={claim.status} /> },
    actions: {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      interactive: true,
      stickyRight: true,
      cell: (claim) => (
        <>
          <Button
            variant="outline"
            size="sm"
            className={compactActions ? "px-2 2xl:px-3" : undefined}
            onClick={() => onView(claim)}
            aria-label={`View claim ${claim.id}`}
            title="View claim"
          >
            <Eye aria-hidden="true" />
            <span className={compactActions ? "hidden 2xl:inline" : undefined}>View</span>
          </Button>
          {onProcess && (
            <Button
              size="sm"
              className="px-2 2xl:px-3"
              onClick={() => onProcess(claim)}
              disabled={claim.status === "PROCESSING"}
              aria-label={`Process claim ${claim.id}`}
              title="Process claim"
            >
              <Play aria-hidden="true" />
              <span className="hidden 2xl:inline">Process</span>
            </Button>
          )}
        </>
      ),
    },
  };
}

/** Claims table used on the dashboard and the claims list. Pick the columns to show with `columns`. */
export function ClaimTable({ claims, columns, onView, onProcess, emptyState, caption }: ClaimTableProps) {
  const definitions = buildColumns(onView, onProcess);
  return (
    <DataTable
      caption={caption}
      columns={columns.map((id) => ({ ...definitions[id], className: cn("px-2.5", definitions[id].className) }))}
      rows={claims}
      getRowId={(claim) => claim.id}
      onRowClick={onView}
      getRowLabel={(claim) => `Open claim ${claim.id} for ${claim.patientName}`}
      emptyState={emptyState}
    />
  );
}
