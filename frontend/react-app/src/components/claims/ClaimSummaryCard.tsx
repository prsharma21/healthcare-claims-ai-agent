import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { Card } from "@/components/ui/card";
import type { Claim } from "@/types/claim";
import { formatCurrency, formatDate } from "@/utils/format";

import { ClaimStatusBadge } from "./ClaimStatusBadge";

/** Key facts strip at the top of the claim details page. */
export function ClaimSummaryCard({ claim }: { claim: Claim }) {
  return (
    <Card className="px-4 py-4">
      <InfoGrid className="grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
        <InfoItem label="Claim ID" value={claim.id} mono />
        <InfoItem label="Patient" value={claim.patientName} hint={claim.patientId} />
        <InfoItem label="Provider" value={claim.providerName} hint={claim.providerId} />
        <InfoItem label="Payer" value={claim.payerName} hint={claim.payerId} />
        <InfoItem label="Amount" value={<span className="tabular-nums">{formatCurrency(claim.amount)}</span>} />
        <InfoItem label="Date of Service" value={formatDate(claim.dateOfService)} />
        <InfoItem
          label="Final Decision"
          value={
            claim.decision ? (
              <ClaimStatusBadge status={claim.decision.status} />
            ) : (
              <ClaimStatusBadge status={claim.status === "PROCESSING" ? "PROCESSING" : "PENDING"} />
            )
          }
        />
      </InfoGrid>
    </Card>
  );
}
