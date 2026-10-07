import { CheckCircle2, Network } from "lucide-react";

import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { Button } from "@/components/ui/button";
import type { PipelineStep } from "@/types/agent";
import type { Claim } from "@/types/claim";
import { formatFileSize } from "@/utils/format";

const verifiedSystems = [
  { name: "Mock EHR", detail: "Patient demographics, history and medications" },
  { name: "Mock Payer", detail: "Eligibility, coverage and claim submission" },
  { name: "Mock Provider", detail: "Provider network status and credentials" },
  { name: "Mock Coding API", detail: "ICD-10 and CPT validation" },
];

interface SystemStepDetailsProps {
  step: PipelineStep;
  claim: Claim;
  onViewEnterpriseSystems?: () => void;
}

/** Details for pipeline steps that are not run by an AI agent. */
export function SystemStepDetails({ step, claim, onViewEnterpriseSystems }: SystemStepDetailsProps) {
  if (step.key === "CLAIM_RECEIVED") {
    return (
      <InfoGrid columns={3}>
        <InfoItem label="Document" value={claim.document.fileName} />
        <InfoItem label="Pages" value={claim.document.pageCount} />
        <InfoItem label="Size" value={formatFileSize(claim.document.fileSizeBytes)} />
        <InfoItem label="Storage (S3, mock)" value={claim.document.storageKey} mono className="sm:col-span-2 lg:col-span-3" />
      </InfoGrid>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {verifiedSystems.map((system) => (
          <li key={system.name} className="flex items-start gap-2 rounded-md border px-3 py-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden="true" />
            <span>
              <span className="block text-sm font-medium">{system.name}</span>
              <span className="block text-xs text-muted-foreground">{system.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Calls are routed through the AgentCore Gateway / MCP tools (mocked in this version).</p>
      {onViewEnterpriseSystems && (
        <div>
          <Button variant="outline" size="sm" onClick={onViewEnterpriseSystems}>
            <Network aria-hidden="true" />
            View Enterprise Systems
          </Button>
        </div>
      )}
    </div>
  );
}
