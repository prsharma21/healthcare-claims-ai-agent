import { Building2 } from "lucide-react";

import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Payer, Policy } from "@/types/payer";
import { formatCurrency, formatDate } from "@/utils/format";

export function PayerSummaryCard({ payer, policy }: { payer: Payer; policy: Policy }) {
  return (
    <SectionCard title="Payer Information" icon={Building2}>
      <InfoGrid>
        <InfoItem label="Payer" value={payer.name} hint={payer.id} />
        <InfoItem label="Policy" value={policy.id} hint={policy.planName} />
        <InfoItem
          label="Policy Status"
          value={<StatusBadge label={policy.status === "ACTIVE" ? "Active" : "Inactive"} tone={policy.status === "ACTIVE" ? "success" : "danger"} />}
        />
        <InfoItem label="Coverage" value={`${policy.coveragePercent}%`} />
        <InfoItem label="Policy Period" value={`${formatDate(policy.effectiveFrom)} – ${formatDate(policy.effectiveTo)}`} />
        <InfoItem label="Annual Limit" value={formatCurrency(policy.annualLimit)} />
      </InfoGrid>
    </SectionCard>
  );
}
