import { History, ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import type { ProcessingRun } from "@/types/agent";
import type { ClaimStatus } from "@/types/claim";

import { FraudHistoryTable } from "./FraudHistoryTable";
import { FraudRiskCard } from "./FraudRiskCard";

interface FraudAnalysisPanelProps {
  run: ProcessingRun | null;
  claimDecision: ClaimStatus | null;
}

export function FraudAnalysisPanel({ run, claimDecision }: FraudAnalysisPanelProps) {
  const fraud = run?.agents.find((agent) => agent.agent === "FRAUD");

  if (!fraud || fraud.agent !== "FRAUD") {
    return (
      <SectionCard title="Fraud Analysis" icon={ShieldAlert}>
        <EmptyState
          icon={ShieldAlert}
          title={run?.status === "RUNNING" ? "Fraud analysis in progress..." : "No fraud analysis yet."}
          description="The Fraud Agent scores the claim once AI processing reaches the Fraud Detection step."
        />
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Fraud Analysis"
        description="Fraud, waste and abuse checks performed by the Fraud Agent."
        icon={ShieldAlert}
      >
        <FraudRiskCard analysis={fraud.analysis} claimDecision={claimDecision} embedded />
      </SectionCard>
      <SectionCard
        title="Historical Claims"
        description="Previous claims for this patient used for duplicate and pattern checks."
        icon={History}
        contentClassName="p-0"
      >
        <FraudHistoryTable claims={fraud.analysis.historicalClaims} matchingClaimId={fraud.analysis.matchingClaimId} />
      </SectionCard>
    </div>
  );
}
