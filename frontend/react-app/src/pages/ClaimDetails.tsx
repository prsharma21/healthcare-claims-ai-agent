import { useEffect, useRef } from "react";
import { BookOpen, BrainCircuit, History, LayoutList, Loader2, Network, Play, RefreshCw, ShieldAlert } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { ClaimProcessingPanel } from "@/components/agents/ClaimProcessingPanel";
import { AuditTrail } from "@/components/claims/AuditTrail";
import { ClaimOverview } from "@/components/claims/ClaimOverview";
import { ClaimStatusBadge } from "@/components/claims/ClaimStatusBadge";
import { ClaimSummaryCard } from "@/components/claims/ClaimSummaryCard";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { FraudAnalysisPanel } from "@/components/fraud/FraudAnalysisPanel";
import { EnterpriseSystemsPanel } from "@/components/integrations/EnterpriseSystemsPanel";
import { RAGEvidencePanel } from "@/components/rag/RAGEvidencePanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAsync } from "@/hooks/useAsync";
import { useClaimProcessing } from "@/hooks/useClaimProcessing";
import { claimsService } from "@/services/claimsService";
import { formatDateTime } from "@/utils/format";

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutList },
  { value: "ai-processing", label: "AI Processing", icon: BrainCircuit },
  { value: "rag-evidence", label: "RAG Evidence", icon: BookOpen },
  { value: "enterprise-systems", label: "Enterprise Systems", icon: Network },
  { value: "fraud-analysis", label: "Fraud Analysis", icon: ShieldAlert },
  { value: "audit-trail", label: "Audit Trail", icon: History },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function isTabValue(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

export default function ClaimDetails() {
  const { claimId = "" } = useParams();
  // Remount when the claim changes so no state from the previous claim is shown.
  return <ClaimDetailsView key={claimId} claimId={claimId} />;
}

function ClaimDetailsView({ claimId }: { claimId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "overview";

  const detail = useAsync(() => claimsService.getClaimById(claimId), [claimId]);
  const { reload: reloadDetail } = detail;
  const processing = useClaimProcessing(claimId, { onComplete: reloadDetail });
  const { run, isRunning, start } = processing;
  const runStatus = run?.status;

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "overview") next.delete("tab");
    else next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (runStatus === "RUNNING") reloadDetail();
  }, [runStatus, reloadDetail]);

  // "Process" buttons elsewhere link here with ?process=1 to start processing automatically.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || searchParams.get("process") !== "1" || !run) return;
    autoStarted.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete("process");
    next.set("tab", "ai-processing");
    setSearchParams(next, { replace: true });
    if (run.status !== "RUNNING") void start();
  }, [run, searchParams, setSearchParams, start]);

  if (detail.error) {
    return (
      <>
        <PageHeader title="Claim Details" backTo={{ to: "/claims", label: "Back to claims" }} />
        <Card>
          <ErrorState
            title="Unable to load claim."
            error={detail.error}
            onRetry={detail.reload}
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/claims">Go to claims list</Link>
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  if (!detail.data) {
    return (
      <>
        <PageHeader title="Claim Details" backTo={{ to: "/claims", label: "Back to claims" }} />
        <Card>
          <LoadingState message={`Loading claim ${claimId}...`} rows={4} />
        </Card>
      </>
    );
  }

  const { claim } = detail.data;
  const completedSteps = run?.steps.filter((step) => step.status === "COMPLETED").length ?? 0;

  const handleProcess = () => {
    setTab("ai-processing");
    void start();
  };

  return (
    <>
      <PageHeader
        title="Claim Details"
        backTo={{ to: "/claims", label: "Back to claims" }}
        meta={
          <>
            <span className="font-mono text-sm font-semibold text-slate-900">{claim.id}</span>
            <ClaimStatusBadge status={claim.status} />
            <span className="text-xs text-muted-foreground">Submitted {formatDateTime(claim.submittedAt)}</span>
          </>
        }
        actions={
          <Button onClick={handleProcess} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" /> Processing...
              </>
            ) : runStatus === "NOT_STARTED" ? (
              <>
                <Play aria-hidden="true" /> Process Claim
              </>
            ) : (
              <>
                <RefreshCw aria-hidden="true" /> Re-run AI Processing
              </>
            )}
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <ClaimSummaryCard claim={claim} />

        {isRunning && activeTab !== "ai-processing" && run && (
          <div role="status" className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                AI processing in progress: step {Math.min(completedSteps + 1, run.steps.length)} of {run.steps.length}
              </p>
              <Progress value={run.progress} className="mt-1.5 bg-blue-100" aria-label={`Processing progress ${run.progress}%`} />
            </div>
            <Button variant="outline" size="sm" onClick={() => setTab("ai-processing")}>
              View progress
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setTab}>
          <TabsList aria-label="Claim sections">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}>
                <Icon aria-hidden="true" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <ClaimOverview detail={detail.data} />
          </TabsContent>
          <TabsContent value="ai-processing">
            <ClaimProcessingPanel
              claim={claim}
              processing={processing}
              onViewRagEvidence={() => setTab("rag-evidence")}
              onViewEnterpriseSystems={() => setTab("enterprise-systems")}
            />
          </TabsContent>
          <TabsContent value="rag-evidence">
            <RAGEvidencePanel claimId={claim.id} refreshKey={run?.completedAt ?? runStatus} />
          </TabsContent>
          <TabsContent value="enterprise-systems">
            <EnterpriseSystemsPanel claimId={claim.id} refreshKey={run?.completedAt ?? runStatus} />
          </TabsContent>
          <TabsContent value="fraud-analysis">
            <FraudAnalysisPanel run={run} claimDecision={claim.decision?.status ?? null} />
          </TabsContent>
          <TabsContent value="audit-trail">
            <AuditTrail events={detail.data.auditTrail} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
