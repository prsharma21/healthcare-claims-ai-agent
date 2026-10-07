import { CheckCircle2, AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EvaluationMetric } from "@/types/evaluation";
import { formatPercent } from "@/utils/format";

export function formatMetricValue(metric: EvaluationMetric, value = metric.value): string {
  return metric.unit === "PERCENT" ? formatPercent(value) : `${value.toFixed(1)} sec`;
}

export function meetsTarget(metric: EvaluationMetric): boolean {
  return metric.lowerIsBetter ? metric.value <= metric.target : metric.value >= metric.target;
}

export function EvaluationMetricCard({ metric }: { metric: EvaluationMetric }) {
  const onTarget = meetsTarget(metric);
  const comparison = metric.lowerIsBetter ? "≤" : "≥";

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</p>
        {onTarget ? (
          <CheckCircle2 className="size-4 shrink-0 text-green-600" aria-label="Meets target" />
        ) : (
          <AlertTriangle className="size-4 shrink-0 text-amber-600" aria-label="Below target" />
        )}
      </div>
      <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatMetricValue(metric)}</p>
      {metric.unit === "PERCENT" && (
        <Progress
          value={metric.value * 100}
          indicatorClassName={onTarget ? "bg-green-600" : "bg-amber-500"}
          aria-label={`${metric.label} ${formatMetricValue(metric)}`}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Target {comparison} {formatMetricValue(metric, metric.target)}
      </p>
      <p className="text-xs text-muted-foreground">{metric.description}</p>
    </Card>
  );
}
