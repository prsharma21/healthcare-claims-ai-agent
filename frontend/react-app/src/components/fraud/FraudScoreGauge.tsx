import { cn } from "@/lib/utils";
import { riskFromScore, riskMeta } from "@/utils/status";

/** Horizontal gauge with low / medium / high zones and a marker at the score. */
export function FraudScoreGauge({ score, className }: { score: number; className?: string }) {
  const risk = riskFromScore(score);
  const position = Math.min(100, Math.max(0, score * 100));

  return (
    <div className={cn("w-full", className)}>
      <div
        role="meter"
        aria-label="Fraud score"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={score}
        aria-valuetext={`${score.toFixed(2)} (${riskMeta[risk].label} risk)`}
        className="relative pt-3"
      >
        <span
          className="absolute top-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-slate-900"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        />
        <div className="flex h-2.5 overflow-hidden rounded-full" aria-hidden="true">
          <span className="w-[30%] bg-green-500" />
          <span className="w-[40%] bg-amber-400" />
          <span className="w-[30%] bg-red-500" />
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground" aria-hidden="true">
        <span>0.0 Low</span>
        <span>0.3</span>
        <span>0.7</span>
        <span>High 1.0</span>
      </div>
    </div>
  );
}
