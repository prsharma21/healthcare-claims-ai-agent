import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";
import type { FraudCheck, FraudCheckResult } from "@/types/agent";
import { fraudCheckMeta } from "@/utils/status";

const resultIcons: Record<FraudCheckResult, { icon: LucideIcon; className: string }> = {
  PASSED: { icon: CheckCircle2, className: "text-green-600" },
  WARNING: { icon: AlertTriangle, className: "text-amber-500" },
  FAILED: { icon: XCircle, className: "text-red-600" },
};

export function FraudChecks({ checks }: { checks: FraudCheck[] }) {
  return (
    <ul className="divide-y rounded-md border" aria-label="Fraud checks">
      {checks.map((check) => {
        const { icon: Icon, className } = resultIcons[check.result];
        const meta = fraudCheckMeta[check.result];
        return (
          <li key={check.name} className="flex items-start gap-3 px-3 py-2.5">
            <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{check.name}</p>
              <p className="text-xs text-muted-foreground">{check.detail}</p>
            </div>
            <StatusBadge label={meta.label} tone={meta.tone} />
          </li>
        );
      })}
    </ul>
  );
}
