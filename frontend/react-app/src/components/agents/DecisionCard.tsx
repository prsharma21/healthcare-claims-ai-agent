import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";

import { ConfidenceMeter } from "@/components/common/ConfidenceMeter";
import { cn } from "@/lib/utils";
import type { FinalDecisionStatus } from "@/types/claim";
import { formatDateTime } from "@/utils/format";
import { claimStatusMeta } from "@/utils/status";

const decisionStyles: Record<FinalDecisionStatus, { icon: LucideIcon; container: string; iconWrap: string; title: string }> = {
  APPROVED: {
    icon: CheckCircle2,
    container: "border-green-200 bg-green-50/60",
    iconWrap: "bg-green-600 text-white",
    title: "text-green-800",
  },
  DENIED: {
    icon: XCircle,
    container: "border-red-200 bg-red-50/60",
    iconWrap: "bg-red-600 text-white",
    title: "text-red-800",
  },
  REQUEST_INFORMATION: {
    icon: AlertTriangle,
    container: "border-amber-200 bg-amber-50/60",
    iconWrap: "bg-amber-500 text-white",
    title: "text-amber-800",
  },
  FRAUD_REVIEW: {
    icon: ShieldAlert,
    container: "border-orange-200 bg-orange-50/60",
    iconWrap: "bg-orange-600 text-white",
    title: "text-orange-800",
  },
};

interface DecisionCardProps {
  status: FinalDecisionStatus;
  reason: string;
  confidence: number;
  decidedAt?: string;
  nextSteps?: string[];
  compact?: boolean;
  className?: string;
}

/** Prominent final decision of the Decision Agent. */
export function DecisionCard({ status, reason, confidence, decidedAt, nextSteps = [], compact = false, className }: DecisionCardProps) {
  const style = decisionStyles[status];
  const Icon = style.icon;

  return (
    <section
      aria-label={`Final decision: ${claimStatusMeta[status].label}`}
      className={cn("rounded-lg border", style.container, compact ? "p-4" : "p-5", className)}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className={cn("flex shrink-0 items-center justify-center rounded-md", style.iconWrap, compact ? "size-9" : "size-11")}>
            <Icon className={compact ? "size-5" : "size-6"} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Final Decision</p>
            <p className={cn("font-bold uppercase tracking-wide", style.title, compact ? "text-lg" : "text-2xl")}>
              {claimStatusMeta[status].label}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Reason: </span>
              {reason}
            </p>
            {nextSteps.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next steps</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
                  {nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="w-full shrink-0 rounded-md border bg-card p-3 md:w-56">
          <ConfidenceMeter value={confidence} />
          {decidedAt && <p className="mt-2 text-xs text-muted-foreground">Decided {formatDateTime(decidedAt)}</p>}
        </div>
      </div>
    </section>
  );
}
