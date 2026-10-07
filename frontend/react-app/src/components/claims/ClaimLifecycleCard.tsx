import { ArrowDown, Workflow } from "lucide-react";

import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { ApiClaimStatus } from "@/types/claimApi";
import { apiClaimStatusMeta } from "@/utils/status";

const outcomes: ApiClaimStatus[] = ["APPROVED", "DENIED", "REQUEST_INFORMATION", "FRAUD_REVIEW"];

function Status({ status }: { status: ApiClaimStatus }) {
  return <StatusBadge label={apiClaimStatusMeta[status].label} tone={apiClaimStatusMeta[status].tone} dot />;
}

function Arrow() {
  return <ArrowDown className="ml-6 size-4 text-slate-400" aria-hidden="true" />;
}

export function ClaimLifecycleCard() {
  return (
    <SectionCard title="Claim Lifecycle" description="Uploaded claims start as Uploaded." icon={Workflow}>
      <ol className="flex flex-col items-start gap-2 text-sm" aria-label="Claim statuses in order">
        <li className="flex items-center gap-2">
          <Status status="UPLOADED" />
          <span className="text-xs text-muted-foreground">Claim PDF stored in Amazon S3</span>
        </li>
        <li className="flex flex-col gap-2">
          <Arrow />
          <span className="flex items-center gap-2">
            <Status status="PROCESSING" />
            <span className="text-xs text-muted-foreground">AI agents review the claim</span>
          </span>
        </li>
        <li className="flex flex-col gap-2">
          <Arrow />
          <span className="flex flex-wrap gap-1.5">
            {outcomes.map((status) => (
              <Status key={status} status={status} />
            ))}
          </span>
        </li>
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        <span className="font-medium text-slate-700">Received</span> is used for claims registered without a
        document. <span className="font-medium text-slate-700">Failed</span> is used when processing cannot be
        completed.
      </p>
    </SectionCard>
  );
}
