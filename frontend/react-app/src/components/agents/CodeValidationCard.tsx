import { CheckCircle2, XCircle } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";
import type { CodeValidation } from "@/types/agent";

const codeTypeLabels = {
  ICD10: "Diagnosis Code (ICD-10)",
  CPT: "Procedure Code (CPT)",
};

export function CodeValidationCard({ code }: { code: CodeValidation }) {
  const Icon = code.valid ? CheckCircle2 : XCircle;
  return (
    <div className={cn("flex items-start gap-3 rounded-md border p-3", code.valid ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50")}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", code.valid ? "text-green-600" : "text-red-600")} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{codeTypeLabels[code.codeType]}</p>
        <p className="font-mono text-lg font-semibold text-slate-900">{code.code}</p>
        <p className="text-sm text-slate-700">{code.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">{code.note}</p>
      </div>
      <StatusBadge label={code.valid ? "Valid" : "Invalid"} tone={code.valid ? "success" : "danger"} />
    </div>
  );
}
