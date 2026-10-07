import type { LucideIcon } from "lucide-react";
import { BrainCircuit, History, Network, Server, UserRound } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import type { AuditActorType, AuditEvent } from "@/types/claim";
import { formatDate, formatTime, humanize } from "@/utils/format";

const actorIcons: Record<AuditActorType, LucideIcon> = {
  USER: UserRound,
  SYSTEM: Server,
  AGENT: BrainCircuit,
  INTEGRATION: Network,
};

export function AuditTrail({ events }: { events: AuditEvent[] }) {
  return (
    <SectionCard
      title="Audit Trail"
      description="Chronological record of every action taken on this claim."
      icon={History}
    >
      {events.length === 0 ? (
        <EmptyState title="No audit events yet." />
      ) : (
        <ol className="relative flex flex-col">
          {events.map((event, index) => {
            const Icon = actorIcons[event.actorType];
            return (
              <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < events.length - 1 && (
                  <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-border" aria-hidden="true" />
                )}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-slate-600">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                    <Badge tone="outline">{humanize(event.actorType)}</Badge>
                  </div>
                  <p className="text-sm text-slate-700">{event.detail}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.actor} ·{" "}
                    <time dateTime={event.timestamp}>
                      {formatDate(event.timestamp)}, {formatTime(event.timestamp)}
                    </time>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
