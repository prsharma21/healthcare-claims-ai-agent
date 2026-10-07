import type { LucideIcon } from "lucide-react";
import { Building2, Code2, Hospital, UserRound } from "lucide-react";

import type { IntegrationSystemId } from "@/types/integration";

export const integrationIcons: Record<IntegrationSystemId, LucideIcon> = {
  EHR: UserRound,
  PAYER: Building2,
  PROVIDER: Hospital,
  CODING: Code2,
};
