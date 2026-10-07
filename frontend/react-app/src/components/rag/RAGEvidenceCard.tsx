import { useId, useState } from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { RAGDocumentType, RAGSource } from "@/types/rag";

export const documentTypeLabels: Record<RAGDocumentType, string> = {
  POLICY: "Insurance Policy",
  CLAIMS_RULES: "Claims Rules",
  CLINICAL_GUIDELINE: "Clinical Guideline",
  CODING_REFERENCE: "Coding Reference",
  FAQ: "FAQ",
};

interface RAGEvidenceCardProps {
  source: RAGSource;
  rank: number;
  onViewSource: (source: RAGSource) => void;
}

/** One retrieved chunk from the knowledge base. Expand to read the full excerpt. */
export function RAGEvidenceCard({ source, rank, onViewSource }: RAGEvidenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const excerptId = useId();

  return (
    <article className="rounded-lg border bg-card shadow-xs" aria-label={`Source ${rank}: ${source.documentName}`}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <FileText className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">#{rank}</span>
            <h4 className="font-mono text-sm font-semibold text-slate-900">{source.documentName}</h4>
            <Badge tone="info">{documentTypeLabels[source.documentType]}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Page {source.page} · {source.section}
          </p>
          <p className={cn("mt-2 text-sm text-slate-700", !expanded && "line-clamp-2")} id={excerptId}>
            &ldquo;{source.excerpt}&rdquo;
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-36">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium uppercase tracking-wide text-muted-foreground">Relevance</span>
            <span className="font-semibold tabular-nums">{source.relevanceScore.toFixed(2)}</span>
          </div>
          <Progress value={source.relevanceScore * 100} aria-label={`Relevance score ${source.relevanceScore.toFixed(2)}`} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={excerptId}
        >
          <ChevronDown className={cn("transition-transform", expanded && "rotate-180")} aria-hidden="true" />
          {expanded ? "Hide full excerpt" : "Show full excerpt"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onViewSource(source)} aria-label={`View source ${source.documentName}`}>
          <ExternalLink aria-hidden="true" />
          View Source
        </Button>
      </div>
    </article>
  );
}
