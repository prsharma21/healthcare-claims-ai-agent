import { BookOpen, Search, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { LoadingState } from "@/components/common/LoadingState";
import { SectionCard } from "@/components/common/SectionCard";
import { Card } from "@/components/ui/card";
import { useAsync } from "@/hooks/useAsync";
import { claimsService } from "@/services/claimsService";
import { formatDateTime, formatLatency } from "@/utils/format";

import { RAGSourceList } from "./RAGSourceList";

interface RAGEvidencePanelProps {
  claimId: string;
  /** Changes when processing finishes so the evidence is reloaded. */
  refreshKey?: string | null;
}

export function RAGEvidencePanel({ claimId, refreshKey }: RAGEvidencePanelProps) {
  const { data: evidence, error, isLoading, reload } = useAsync(() => claimsService.getRAGEvidence(claimId), [claimId, refreshKey]);

  if (isLoading && evidence === undefined) {
    return (
      <Card>
        <LoadingState message="Retrieving evidence from the knowledge base..." rows={3} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorState title="Unable to load RAG evidence." error={error} onRetry={reload} />
      </Card>
    );
  }

  if (!evidence) {
    return (
      <Card>
        <EmptyState
          icon={BookOpen}
          title="No RAG evidence yet."
          description="Evidence is retrieved from the knowledge base when the claim is processed by the Policy Agent."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="RAG Evidence" description="Knowledge base retrieval used by the Policy Agent." icon={Search}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Query</p>
            <p className="mt-1 rounded-md border bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
              &ldquo;{evidence.query}&rdquo;
            </p>
          </div>
          <div className="rounded-md border-l-4 border-blue-600 bg-blue-50/60 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-900">
              <Sparkles className="size-3.5" aria-hidden="true" /> Grounded answer
            </p>
            <p className="mt-1 text-sm text-slate-800">{evidence.answer}</p>
          </div>
          <InfoGrid columns={4}>
            <InfoItem label="Knowledge Base" value={evidence.knowledgeBase} />
            <InfoItem label="Documents Retrieved" value={`${evidence.sources.length} (top ${evidence.topK})`} />
            <InfoItem label="Retrieval Latency" value={formatLatency(evidence.retrievalLatencyMs)} />
            <InfoItem label="Retrieved" value={formatDateTime(evidence.retrievedAt)} />
          </InfoGrid>
        </div>
      </SectionCard>

      <section aria-labelledby="retrieved-documents-heading" className="flex flex-col gap-3">
        <h3 id="retrieved-documents-heading" className="text-sm font-semibold text-slate-900">
          Retrieved Documents
        </h3>
        <RAGSourceList sources={evidence.sources} />
      </section>
    </div>
  );
}
