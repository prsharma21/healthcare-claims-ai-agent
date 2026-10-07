import { useId, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ApiCall, EnterpriseSystem } from "@/types/integration";
import { formatLatency, formatRelativeTime } from "@/utils/format";
import { integrationStatusMeta } from "@/utils/status";

import { ApiCallList } from "./ApiCallList";
import { integrationIcons } from "./integrationIcons";

interface IntegrationStatusCardProps {
  system: EnterpriseSystem;
  calls?: ApiCall[];
}

export function IntegrationStatusCard({ system, calls }: IntegrationStatusCardProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const Icon = integrationIcons[system.id];
  const meta = integrationStatusMeta[system.status];

  return (
    <Card className="flex flex-col">
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{system.name}</h4>
              <p className="text-xs text-muted-foreground">{system.description}</p>
            </div>
          </div>
          <StatusBadge label={meta.label} tone={meta.tone} dot />
        </div>

        <InfoGrid className="grid-cols-2 sm:grid-cols-2">
          <InfoItem label="Response" value={formatLatency(system.responseTimeMs)} />
          <InfoItem label="Last Request" value={formatRelativeTime(system.lastRequestAt)} />
        </InfoGrid>

        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Operations</p>
          <ul className="flex flex-col gap-1">
            {system.operations.map((operation) => (
              <li key={operation.name} className="flex items-center gap-1.5 text-sm">
                {operation.available ? (
                  <Check className="size-3.5 text-green-600" aria-hidden="true" />
                ) : (
                  <X className="size-3.5 text-red-600" aria-hidden="true" />
                )}
                {operation.name}
                <span className="sr-only">{operation.available ? "(available)" : "(unavailable)"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex items-center justify-between border-t px-4 py-2 text-xs font-medium text-primary hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        API information
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <div id={contentId} hidden={!open} className="flex flex-col gap-3 border-t px-4 py-3">
        <InfoItem label="Base URL" value={system.baseUrl} mono />
        {calls ? <ApiCallList calls={calls} title="Requests for this claim" /> : <p className="text-xs text-muted-foreground">Open a claim to see its requests.</p>}
      </div>
    </Card>
  );
}
