import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Code2, FileSearch, Inbox, Network, ScrollText, ShieldAlert } from "lucide-react";

import type { AgentType, PipelineStepKey } from "@/types/agent";

export const stepIcons: Record<PipelineStepKey, LucideIcon> = {
  CLAIM_RECEIVED: Inbox,
  DOCUMENT_EXTRACTION: FileSearch,
  POLICY_VALIDATION: ScrollText,
  MEDICAL_CODING: Code2,
  FRAUD_DETECTION: ShieldAlert,
  ENTERPRISE_VERIFICATION: Network,
  DECISION: CheckCircle2,
};

export const agentIcons: Record<AgentType, LucideIcon> = {
  DOCUMENT: FileSearch,
  POLICY: ScrollText,
  CODING: Code2,
  FRAUD: ShieldAlert,
  DECISION: CheckCircle2,
};
