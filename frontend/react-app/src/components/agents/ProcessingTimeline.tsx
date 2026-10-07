import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AgentStatus, ProcessingRun } from "@/types/agent";
import type { Claim } from "@/types/claim";

import { AgentCard } from "./AgentCard";
import { stepIcons } from "./agentIcons";

const markerStyles: Record<AgentStatus, string> = {
  PENDING: "border-slate-300 bg-card text-slate-400",
  RUNNING: "border-blue-600 bg-blue-600 text-white",
  COMPLETED: "border-green-600 bg-green-600 text-white",
  FAILED: "border-red-600 bg-red-600 text-white",
};

interface ProcessingTimelineProps {
  run: ProcessingRun;
  claim: Claim;
  onViewRagEvidence?: () => void;
  onViewEnterpriseSystems?: () => void;
}

/** Vertical pipeline: Claim Received → agents → Decision. Each step expands to show details. */
export function ProcessingTimeline({ run, claim, onViewRagEvidence, onViewEnterpriseSystems }: ProcessingTimelineProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const allExpanded = expanded.size === run.steps.length;

  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-sm text-xs font-medium text-primary hover:underline"
          onClick={() => setExpanded(allExpanded ? new Set() : new Set(run.steps.map((step) => step.key)))}
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <ol className="flex flex-col" aria-label="AI processing pipeline">
        {run.steps.map((step, index) => {
          const Icon = stepIcons[step.key];
          const isLast = index === run.steps.length - 1;
          const result = step.agent ? run.agents.find((agent) => agent.agent === step.agent) : undefined;
          return (
            <li key={step.key} className="relative flex gap-3 pb-3 last:pb-0 sm:gap-4">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[17px] top-10 h-[calc(100%-2.5rem)] w-0.5",
                    step.status === "COMPLETED" ? "bg-green-500" : "bg-slate-200",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 mt-2 flex size-9 shrink-0 items-center justify-center rounded-full border-2",
                  markerStyles[step.status],
                )}
                aria-hidden="true"
              >
                {step.status === "COMPLETED" ? (
                  <Check className="size-4" />
                ) : step.status === "RUNNING" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : step.status === "FAILED" ? (
                  <X className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <AgentCard
                  step={step}
                  result={result}
                  claim={claim}
                  expanded={expanded.has(step.key)}
                  onToggle={() => toggle(step.key)}
                  onViewRagEvidence={onViewRagEvidence}
                  onViewEnterpriseSystems={onViewEnterpriseSystems}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
