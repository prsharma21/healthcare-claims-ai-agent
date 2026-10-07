import { FileText, Receipt, Stethoscope, ClipboardList } from "lucide-react";

import { DecisionCard } from "@/components/agents/DecisionCard";
import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { SectionCard } from "@/components/common/SectionCard";
import type { ClaimDetail } from "@/types/claim";
import { formatCurrency, formatDate, formatDateTime, formatFileSize, humanize } from "@/utils/format";

import { ClaimStatusBadge } from "./ClaimStatusBadge";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { PayerSummaryCard } from "./PayerSummaryCard";
import { ProviderSummaryCard } from "./ProviderSummaryCard";
import { RiskBadge } from "./RiskBadge";

export function ClaimOverview({ detail }: { detail: ClaimDetail }) {
  const { claim, patient, provider, payer, policy } = detail;
  const coverage = claim.decision?.status === "APPROVED" ? policy.coveragePercent : null;
  const payable = coverage !== null ? Math.round((claim.amount * coverage) / 100) : null;

  return (
    <div className="flex flex-col gap-4">
      {claim.decision && (
        <DecisionCard
          status={claim.decision.status}
          reason={claim.decision.reason}
          confidence={claim.decision.confidence}
          decidedAt={claim.decision.decidedAt}
        />
      )}

      <SectionCard title="Claim Summary" icon={ClipboardList}>
        <InfoGrid columns={4}>
          <InfoItem label="Claim ID" value={claim.id} mono />
          <InfoItem label="Claim Type" value={humanize(claim.claimType)} />
          <InfoItem label="Submitted" value={formatDateTime(claim.submittedAt)} />
          <InfoItem label="Status" value={<ClaimStatusBadge status={claim.status} />} />
          <InfoItem label="Patient" value={claim.patientName} hint={claim.patientId} />
          <InfoItem label="Provider" value={claim.providerName} hint={claim.providerId} />
          <InfoItem label="Payer" value={claim.payerName} hint={claim.payerId} />
          <InfoItem label="AI Risk" value={<RiskBadge risk={claim.riskLevel} />} />
        </InfoGrid>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <PatientSummaryCard patient={patient} />
        <ProviderSummaryCard provider={provider} />
        <PayerSummaryCard payer={payer} policy={policy} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Clinical Information" icon={Stethoscope}>
          <InfoGrid>
            <InfoItem label="Diagnosis" value={claim.diagnosisName} hint={claim.diagnosisDescription} />
            <InfoItem label="ICD-10" value={claim.diagnosisCode} mono />
            <InfoItem label="Procedure" value={claim.procedureDescription} />
            <InfoItem label="CPT" value={claim.procedureCode} mono />
            <InfoItem label="Date of Service" value={formatDate(claim.dateOfService)} />
            <InfoItem label="Claim Type" value={humanize(claim.claimType)} />
          </InfoGrid>
        </SectionCard>

        <SectionCard title="Billing Information" icon={Receipt}>
          <InfoGrid>
            <InfoItem label="Billed Amount" value={formatCurrency(claim.amount)} />
            <InfoItem label="Policy Coverage" value={`${policy.coveragePercent}%`} />
            <InfoItem label="Payable Amount" value={payable !== null ? formatCurrency(payable) : "—"} hint={payable === null ? "Available after approval" : undefined} />
            <InfoItem
              label="Member Responsibility"
              value={payable !== null ? formatCurrency(claim.amount - payable) : "—"}
            />
            <InfoItem label="Currency" value="INR" />
            <InfoItem label="Policy" value={policy.id} mono />
          </InfoGrid>
        </SectionCard>

        <SectionCard title="Document Information" icon={FileText}>
          <InfoGrid>
            <InfoItem label="File Name" value={claim.document.fileName} className="sm:col-span-2" />
            <InfoItem label="File Size" value={formatFileSize(claim.document.fileSizeBytes)} />
            <InfoItem label="Pages" value={claim.document.pageCount} />
            <InfoItem label="Uploaded" value={formatDateTime(claim.document.uploadedAt)} />
            <InfoItem label="Format" value="PDF" />
            <InfoItem label="Storage Location" value={claim.document.storageKey} mono className="sm:col-span-2" />
          </InfoGrid>
        </SectionCard>
      </div>
    </div>
  );
}
