import { BrainCircuit, Loader2, Play, RefreshCw } from "lucide-react";

import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BadgeTone } from "@/components/ui/badge";
import type { ClaimProcessingState } from "@/hooks/useClaimProcessing";
import type { ProcessingRunStatus } from "@/types/agent";
import type { Claim } from "@/types/claim";
import { formatDuration } from "@/utils/format";

import { ProcessingTimeline } from "./ProcessingTimeline";

const runStatusMeta: Record<ProcessingRunStatus, { label: string; tone: BadgeTone }> = {
  NOT_STARTED: { label: "Not started", tone: "neutral" },
  RUNNING: { label: "Running", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

interface ClaimProcessingPanelProps {
  claim: Claim;
  processing: ClaimProcessingState;
  onViewRagEvidence?: () => void;
  onViewEnterpriseSystems?: () => void;
}

/** Progress header, run button and pipeline timeline for one claim. */
export function ClaimProcessingPanel({ claim, processing, onViewRagEvidence, onViewEnterpriseSystems }: ClaimProcessingPanelProps) {
  const { run, isLoading, error, isRunning, start, reload } = processing;

  if (isLoading && !run) {
    return (
      <Card>
        <LoadingState message="Loading AI processing results..." rows={4} />
      </Card>
    );
  }

  if (error || !run) {
    return (
      <Card>
        <ErrorState title="Unable to load AI processing results." error={error} onRetry={reload} />
      </Card>
    );
  }

  const completedSteps = run.steps.filter((step) => step.status === "COMPLETED").length;
  const runningStep = run.steps.find((step) => step.status === "RUNNING");
  const totalDuration =
    run.startedAt && run.completedAt ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime() : null;
  const meta = runStatusMeta[run.status];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-2.5">
            <BrainCircuit className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <CardTitle>AI Processing Pipeline</CardTitle>
              <CardDescription>
                Document → Policy → Coding → Fraud → Enterprise verification → Decision
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => void start()} disabled={isRunning} className="w-full sm:w-auto">
            {isRunning ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" /> Processing...
              </>
            ) : run.status === "NOT_STARTED" ? (
              <>
                <Play aria-hidden="true" /> Process Claim
              </>
            ) : (
              <>
                <RefreshCw aria-hidden="true" /> Re-run Processing
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge label={meta.label} tone={meta.tone} dot pulse={isRunning} />
              <span className="text-muted-foreground" aria-live="polite">
                {isRunning && runningStep
                  ? `Step ${completedSteps + 1} of ${run.steps.length}: ${runningStep.label}`
                  : `${completedSteps} of ${run.steps.length} steps completed`}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {totalDuration !== null ? `Total time ${formatDuration(totalDuration)}` : `${run.progress}%`}
            </span>
          </div>
          <Progress
            value={run.progress}
            aria-label={`Processing progress ${run.progress}%`}
            indicatorClassName={run.status === "FAILED" ? "bg-red-600" : run.status === "COMPLETED" ? "bg-green-600" : "bg-blue-600"}
          />
        </CardContent>
      </Card>

      <ProcessingTimeline
        run={run}
        claim={claim}
        onViewRagEvidence={onViewRagEvidence}
        onViewEnterpriseSystems={onViewEnterpriseSystems}
      />
    </div>
  );
}
