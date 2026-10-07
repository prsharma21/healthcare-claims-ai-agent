import { useId } from "react";
import { ChevronDown } from "lucide-react";

import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { cn } from "@/lib/utils";
import type { AgentResult, PipelineStep } from "@/types/agent";
import type { Claim } from "@/types/claim";
import { formatDuration, formatTime } from "@/utils/format";
import { agentNames } from "@/utils/status";

import { AgentDetails } from "./AgentDetails";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { SystemStepDetails } from "./details/SystemStepDetails";

interface AgentCardProps {
  step: PipelineStep;
  result: AgentResult | undefined;
  claim: Claim;
  expanded: boolean;
  onToggle: () => void;
  onViewRagEvidence?: () => void;
  onViewEnterpriseSystems?: () => void;
}

/** One pipeline step. Click the header to expand the agent's findings. */
export function AgentCard({ step, result, claim, expanded, onToggle, onViewRagEvidence, onViewEnterpriseSystems }: AgentCardProps) {
  const contentId = useId();
  const owner = step.agent ? agentNames[step.agent] : "System step";
  const canShowDetails = step.status === "COMPLETED";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card shadow-xs transition-colors",
        step.status === "RUNNING" && "border-blue-300 ring-2 ring-blue-100",
        step.status === "FAILED" && "border-red-300",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex w-full flex-col gap-2 rounded-lg px-4 py-3 text-left hover:bg-slate-50/80 focus-visible:outline-2 focus-visible:-outline-offset-2 sm:flex-row sm:items-center sm:gap-4"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-900">{step.label}</span>
            <span className="text-xs text-muted-foreground">· {owner}</span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{step.status === "PENDING" ? step.description : step.summary}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {step.durationMs !== null && (
            <span className="text-xs tabular-nums text-muted-foreground">{formatDuration(step.durationMs)}</span>
          )}
          <AgentStatusBadge status={step.status} />
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </span>
      </button>

      <div id={contentId} hidden={!expanded} className="border-t px-4 py-4">
        {expanded && (
          <div className="flex flex-col gap-4">
            <InfoGrid columns={4} className="rounded-md bg-slate-50 px-3 py-2.5">
              <InfoItem label="Status" value={<AgentStatusBadge status={step.status} />} />
              <InfoItem label="Started" value={step.startedAt ? formatTime(step.startedAt) : "—"} />
              <InfoItem label="Completed" value={step.completedAt ? formatTime(step.completedAt) : "—"} />
              <InfoItem label="Duration" value={step.durationMs !== null ? formatDuration(step.durationMs) : "—"} />
            </InfoGrid>

            {!canShowDetails && (
              <p className="text-sm text-muted-foreground">
                {step.status === "RUNNING" ? `${owner} is working on this step...` : "Details will appear when this step completes."}
              </p>
            )}
            {canShowDetails && result && <AgentDetails result={result} onViewRagEvidence={onViewRagEvidence} />}
            {canShowDetails && !step.agent && (
              <SystemStepDetails step={step} claim={claim} onViewEnterpriseSystems={onViewEnterpriseSystems} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
