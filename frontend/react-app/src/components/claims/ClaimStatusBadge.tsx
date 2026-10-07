import { StatusBadge } from "@/components/common/StatusBadge";
import type { ClaimStatus } from "@/types/claim";
import { claimStatusMeta } from "@/utils/status";

export function ClaimStatusBadge({ status, className }: { status: ClaimStatus; className?: string }) {
  const meta = claimStatusMeta[status];
  return <StatusBadge label={meta.label} tone={meta.tone} dot pulse={status === "PROCESSING"} className={className} />;
}
