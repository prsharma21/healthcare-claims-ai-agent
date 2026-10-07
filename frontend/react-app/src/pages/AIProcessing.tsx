import { Activity, ExternalLink } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { ClaimProcessingPanel } from "@/components/agents/ClaimProcessingPanel";
import { agentIcons } from "@/components/agents/agentIcons";
import { ClaimStatusBadge } from "@/components/claims/ClaimStatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useAsync } from "@/hooks/useAsync";
import { useClaimProcessing } from "@/hooks/useClaimProcessing";
import { claimsService } from "@/services/claimsService";
import type { AgentPerformance } from "@/types/agent";
import type { Claim } from "@/types/claim";
import { formatDuration, formatNumber, formatPercent } from "@/utils/format";

export default function AIProcessing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const claims = useAsync(() => claimsService.getClaims());
  const performance = useAsync(() => claimsService.getAgentPerformance());

  const requestedId = searchParams.get("claim");
  const selectedClaim = claims.data?.find((claim) => claim.id === requestedId) ?? claims.data?.[0];

  return (
    <>
      <PageHeader title="AI Processing" description="Run the multi-agent pipeline on a claim and inspect each agent's output." />

      <SectionCard title="Agent Performance" description="Today, across all claims" icon={Activity} className="mb-5">
        {performance.error ? (
          <ErrorState title="Unable to load agent performance." error={performance.error} onRetry={performance.reload} />
        ) : !performance.data ? (
          <LoadingState message="Loading agent performance..." />
        ) : performance.data.length === 0 ? (
          <EmptyState title="No agent activity yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {performance.data.map((agent) => (
              <AgentPerformanceCard key={agent.agent} agent={agent} />
            ))}
          </div>
        )}
      </SectionCard>

      {claims.error ? (
        <Card>
          <ErrorState title="Unable to load claims." error={claims.error} onRetry={claims.reload} />
        </Card>
      ) : !claims.data ? (
        <Card>
          <LoadingState message="Loading claims..." rows={4} />
        </Card>
      ) : !selectedClaim ? (
        <Card>
          <EmptyState
            title="No claims found."
            description="Upload a claim to run AI processing."
            action={
              <Button asChild size="sm">
                <Link to="/upload">Upload Claim</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5 sm:max-w-md">
              <Label htmlFor="processing-claim">Claim</Label>
              <NativeSelect
                id="processing-claim"
                value={selectedClaim.id}
                onChange={(event) => setSearchParams({ claim: event.target.value }, { replace: true })}
              >
                {claims.data.map((claim) => (
                  <option key={claim.id} value={claim.id}>
                    {claim.id} · {claim.patientName} · {claim.diagnosisName}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
              <ClaimStatusBadge status={selectedClaim.status} />
              <Button variant="outline" size="sm" asChild>
                <Link to={`/claims/${selectedClaim.id}?tab=ai-processing`}>
                  <ExternalLink aria-hidden="true" /> Open claim details
                </Link>
              </Button>
            </div>
          </Card>
          <SelectedClaimProcessing key={selectedClaim.id} claim={selectedClaim} onComplete={claims.reload} />
        </>
      )}
    </>
  );
}

function SelectedClaimProcessing({ claim, onComplete }: { claim: Claim; onComplete: () => void }) {
  const processing = useClaimProcessing(claim.id, { onComplete });
  return <ClaimProcessingPanel claim={claim} processing={processing} />;
}

function AgentPerformanceCard({ agent }: { agent: AgentPerformance }) {
  const Icon = agentIcons[agent.agent];
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-slate-900">{agent.name}</p>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Avg time</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{formatDuration(agent.averageDurationMs)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Success</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{formatPercent(agent.successRate)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Runs</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{formatNumber(agent.runsToday)}</dd>
        </div>
      </dl>
    </div>
  );
}
