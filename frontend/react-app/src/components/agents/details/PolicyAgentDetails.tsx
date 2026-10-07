import { BookOpen } from "lucide-react";

import { ConfidenceMeter } from "@/components/common/ConfidenceMeter";
import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import type { PolicyAgentResult } from "@/types/agent";

interface PolicyAgentDetailsProps {
  result: PolicyAgentResult;
  onViewRagEvidence?: () => void;
}

export function PolicyAgentDetails({ result, onViewRagEvidence }: PolicyAgentDetailsProps) {
  const { validation } = result;
  return (
    <div className="flex flex-col gap-4">
      <InfoGrid columns={3}>
        <InfoItem
          label="Eligibility"
          value={<StatusBadge label={validation.eligibility === "ACTIVE" ? "Active" : "Inactive"} tone={validation.eligibility === "ACTIVE" ? "success" : "danger"} />}
        />
        <InfoItem
          label="Coverage"
          value={<StatusBadge label={validation.coverage === "COVERED" ? "Covered" : "Not covered"} tone={validation.coverage === "COVERED" ? "success" : "danger"} />}
        />
        <InfoItem
          label="Authorization"
          value={
            <span className="flex flex-wrap gap-1.5">
              <StatusBadge
                label={validation.authorization === "REQUIRED" ? "Required" : "Not required"}
                tone={validation.authorization === "REQUIRED" ? "warning" : "neutral"}
              />
              {validation.authorizationEvidence === "MISSING" && <StatusBadge label="Evidence missing" tone="danger" />}
              {validation.authorizationEvidence === "ON_FILE" && <StatusBadge label="On file" tone="success" />}
            </span>
          }
        />
        <InfoItem label="Coverage %" value={`${validation.coveragePercent}%`} />
        <InfoItem label="Policy" value={validation.policyId} mono />
        <ConfidenceMeter value={result.confidence} />
      </InfoGrid>

      <div className="rounded-md border-l-4 border-blue-600 bg-blue-50/60 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-900">Policy reasoning</p>
        <p className="mt-1 text-sm text-slate-800">&ldquo;{validation.reasoning}&rdquo;</p>
      </div>

      {onViewRagEvidence && (
        <div>
          <Button variant="outline" size="sm" onClick={onViewRagEvidence}>
            <BookOpen aria-hidden="true" />
            View RAG Evidence
          </Button>
        </div>
      )}
    </div>
  );
}
