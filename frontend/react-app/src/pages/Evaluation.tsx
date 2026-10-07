import { useState } from "react";
import { BarChart3, FlaskConical, ListChecks, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

import { VerticalBarChart } from "@/components/charts/VerticalBarChart";
import { chartColors } from "@/components/charts/chartTheme";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EvaluationMetricCard, meetsTarget } from "@/components/evaluation/EvaluationMetricCard";
import { EvaluationTestTable } from "@/components/evaluation/EvaluationTestTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/services/apiClient";
import { claimsService } from "@/services/claimsService";
import { formatDateTime } from "@/utils/format";

export default function Evaluation() {
  const summary = useAsync(() => claimsService.getEvaluationSummary());
  const [runProgress, setRunProgress] = useState<{ completed: number; total: number } | null>(null);
  const isRunning = runProgress !== null;

  const handleRun = async () => {
    setRunProgress({ completed: 0, total: summary.data?.tests.length ?? 0 });
    try {
      const result = await claimsService.runEvaluation((completed, total) => setRunProgress({ completed, total }));
      summary.setData(result);
      const passed = result.tests.filter((test) => test.result === "PASS").length;
      toast.success("Evaluation completed.", { description: `${passed} of ${result.tests.length} test cases passed.` });
    } catch (runError) {
      toast.error("Evaluation failed.", { description: getErrorMessage(runError) });
    } finally {
      setRunProgress(null);
    }
  };

  const data = summary.data;
  const passed = data?.tests.filter((test) => test.result === "PASS").length ?? 0;
  const percentMetrics = data?.metrics.filter((metric) => metric.unit === "PERCENT") ?? [];

  return (
    <>
      <PageHeader
        title="AI Evaluation Dashboard"
        description="Quality metrics for the RAG pipeline and AI decisions, measured against a golden claims dataset."
        meta={
          data && (
            <span className="text-xs text-muted-foreground">
              {data.datasetName} · {data.framework} · Last run {formatDateTime(data.lastRunAt)}
            </span>
          )
        }
        actions={
          <Button onClick={handleRun} disabled={isRunning || !data}>
            {isRunning ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" /> Running...
              </>
            ) : (
              <>
                <Play aria-hidden="true" /> Run Evaluation
              </>
            )}
          </Button>
        }
      />

      {runProgress && (
        <Card className="mb-5 p-4" role="status">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-900">
              <FlaskConical className="size-4 text-primary" aria-hidden="true" />
              Running evaluation suite
            </span>
            <span className="tabular-nums text-muted-foreground">
              {runProgress.completed} of {runProgress.total} test cases
            </span>
          </div>
          <Progress
            value={runProgress.total ? (runProgress.completed / runProgress.total) * 100 : 0}
            aria-label="Evaluation progress"
          />
        </Card>
      )}

      {summary.error ? (
        <Card>
          <ErrorState title="Unable to load evaluation results." error={summary.error} onRetry={summary.reload} />
        </Card>
      ) : !data ? (
        <Card>
          <LoadingState message="Loading evaluation results..." rows={5} />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <section aria-label="Evaluation metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <EvaluationMetricCard key={metric.key} metric={metric} />
            ))}
          </section>

          <div className="grid gap-5 lg:grid-cols-5">
            <SectionCard title="Metric Overview" description="Score per metric (%)" icon={BarChart3} className="lg:col-span-3">
              <VerticalBarChart
                label="Evaluation metric scores"
                seriesName="Score"
                yDomain={[0, 100]}
                height={260}
                valueFormatter={(value) => `${value.toFixed(0)}%`}
                data={percentMetrics.map((metric) => ({
                  name: metric.label,
                  value: Math.round(metric.value * 100),
                  color: meetsTarget(metric) ? chartColors.blue : chartColors.amber,
                }))}
              />
            </SectionCard>
            <SectionCard title="Test Summary" icon={ListChecks} className="lg:col-span-2">
              <dl className="grid grid-cols-3 gap-3 text-center">
                <SummaryStat label="Test cases" value={data.tests.length} />
                <SummaryStat label="Passed" value={passed} className="text-green-700" />
                <SummaryStat label="Failed" value={data.tests.length - passed} className="text-red-700" />
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                Each test runs a synthetic claim through all five agents and compares the final decision with the expected
                outcome. Failed cases are highlighted in the table below.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Run ID: {data.runId}</p>
            </SectionCard>
          </div>

          <SectionCard title="Test Cases" description={`${passed} of ${data.tests.length} passed`} icon={FlaskConical} contentClassName="p-0">
            <EvaluationTestTable tests={data.tests} />
          </SectionCard>
        </div>
      )}
    </>
  );
}

function SummaryStat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-2 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 text-2xl font-semibold tabular-nums text-slate-900", className)}>{value}</dd>
    </div>
  );
}
