import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/utils/format";

interface ConfidenceMeterProps {
  label?: string;
  /** 0 to 1 */
  value: number;
  className?: string;
}

function indicatorColor(value: number): string {
  if (value >= 0.9) return "bg-green-600";
  if (value >= 0.75) return "bg-amber-500";
  return "bg-red-600";
}

export function ConfidenceMeter({ label = "Confidence", value, className }: ConfidenceMeterProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-slate-900">{formatPercent(value)}</span>
      </div>
      <Progress value={value * 100} aria-label={`${label} ${formatPercent(value)}`} indicatorClassName={indicatorColor(value)} />
    </div>
  );
}
