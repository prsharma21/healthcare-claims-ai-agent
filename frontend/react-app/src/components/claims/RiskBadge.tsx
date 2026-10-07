import { StatusBadge } from "@/components/common/StatusBadge";
import type { RiskLevel } from "@/types/claim";
import { riskMeta } from "@/utils/status";

export function RiskBadge({ risk }: { risk: RiskLevel | null }) {
  if (!risk) {
    return <span className="text-xs text-muted-foreground">Not assessed</span>;
  }
  const meta = riskMeta[risk];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}
