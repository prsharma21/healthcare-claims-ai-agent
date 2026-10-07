import type { ReactNode } from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import type { AgentStatus } from "@/types/agent";
import { agentStatusMeta } from "@/utils/status";

const icons: Record<AgentStatus, ReactNode> = {
  PENDING: <Circle aria-hidden="true" />,
  RUNNING: <Loader2 className="animate-spin" aria-hidden="true" />,
  COMPLETED: <CheckCircle2 aria-hidden="true" />,
  FAILED: <XCircle aria-hidden="true" />,
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const meta = agentStatusMeta[status];
  return <StatusBadge label={meta.label} tone={meta.tone} icon={icons[status]} />;
}
