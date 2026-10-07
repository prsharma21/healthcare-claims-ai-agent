import { Building2 } from "lucide-react";

import { ExpandablePanel } from "@/components/common/ExpandablePanel";
import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { ApiCall, PayerVerification } from "@/types/integration";

import { ApiCallList } from "./ApiCallList";

export function PayerPanel({ payer, calls }: { payer: PayerVerification; calls: ApiCall[] }) {
  return (
    <ExpandablePanel
      title="Mock Payer"
      subtitle={`${payer.payerName} · Policy ${payer.policyId}`}
      icon={<Building2 className="size-4" aria-hidden="true" />}
      aside={
        <StatusBadge
          label={payer.eligibility === "ACTIVE" ? "Eligible" : "Not eligible"}
          tone={payer.eligibility === "ACTIVE" ? "success" : "danger"}
        />
      }
    >
      <InfoGrid columns={3}>
        <InfoItem label="Payer" value={payer.payerName} />
        <InfoItem
          label="Eligibility"
          value={<StatusBadge label={payer.eligibility === "ACTIVE" ? "Active" : "Inactive"} tone={payer.eligibility === "ACTIVE" ? "success" : "danger"} />}
        />
        <InfoItem label="Policy" value={payer.policyId} mono />
        <InfoItem
          label={`Coverage · CPT ${payer.procedureCode}`}
          value={<StatusBadge label={payer.coverage === "COVERED" ? "Covered" : "Not covered"} tone={payer.coverage === "COVERED" ? "success" : "danger"} />}
        />
        <InfoItem
          label="Authorization"
          value={<StatusBadge label={payer.authorization === "REQUIRED" ? "Required" : "Not required"} tone={payer.authorization === "REQUIRED" ? "warning" : "neutral"} />}
        />
        <InfoItem label="Coverage" value={`${payer.coveragePercent}%`} />
      </InfoGrid>
      <div className="mt-5">
        <ApiCallList calls={calls} title="API operations" />
      </div>
    </ExpandablePanel>
  );
}
