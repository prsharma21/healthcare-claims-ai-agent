import { ShieldAlert } from "lucide-react";

import { ClaimStatusBadge } from "@/components/claims/ClaimStatusBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FraudAgentResult } from "@/types/agent";
import type { ClaimStatus, RiskLevel } from "@/types/claim";
import { riskMeta } from "@/utils/status";

import { FraudChecks } from "./FraudChecks";
import { FraudScoreGauge } from "./FraudScoreGauge";

interface FraudRiskCardProps {
  analysis: FraudAgentResult["analysis"];
  claimDecision?: ClaimStatus | null;
  /** Hides the card border for use inside another card. */
  embedded?: boolean;
}

const scoreColors: Record<RiskLevel, string> = {
  LOW: "text-green-700",
  MEDIUM: "text-amber-700",
  HIGH: "text-red-700",
};

const iconColors: Record<RiskLevel, string> = {
  LOW: "bg-green-50 text-green-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

export function FraudRiskCard({ analysis, claimDecision, embedded = false }: FraudRiskCardProps) {
  const meta = riskMeta[analysis.riskLevel];
  const content = (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-11 items-center justify-center rounded-md", iconColors[analysis.riskLevel])}>
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fraud Risk</p>
            <StatusBadge label={meta.label} tone={meta.tone} className="mt-0.5 text-xs" />
          </div>
          <div className="ml-4 border-l pl-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fraud Score</p>
            <p className={cn("text-2xl font-bold tabular-nums", scoreColors[analysis.riskLevel])}>{analysis.score.toFixed(2)}</p>
          </div>
        </div>
        <FraudScoreGauge score={analysis.score} className="sm:pl-4" />
      </div>

      <FraudChecks checks={analysis.checks} />

      <div className="flex flex-col gap-2 rounded-md bg-slate-50 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          {analysis.matchingClaimId && (
            <p>
              <span className="text-muted-foreground">Matching claim: </span>
              <span className="font-mono font-semibold text-red-700">{analysis.matchingClaimId}</span>
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Recommendation: </span>
            {analysis.recommendation}
          </p>
        </div>
        {claimDecision && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Decision</span>
            <ClaimStatusBadge status={claimDecision} />
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;
  return <Card className="p-4">{content}</Card>;
}
