import { BookOpen, BrainCircuit, Info, Network, Server } from "lucide-react";

import { ErrorState } from "@/components/common/ErrorState";
import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { useAsync } from "@/hooks/useAsync";
import { claimsService } from "@/services/claimsService";
import { integrationStatusMeta } from "@/utils/status";

export default function Settings() {
  const settings = useAsync(() => claimsService.getSettings());

  return (
    <>
      <PageHeader title="Settings" description="Application, AI and integration configuration." />

      {settings.error ? (
        <Card>
          <ErrorState title="Unable to load settings." error={settings.error} onRetry={settings.reload} />
        </Card>
      ) : !settings.data ? (
        <Card>
          <LoadingState message="Loading settings..." rows={4} />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Settings are read-only in this build. Values come from environment variables and the mock service; they will be
              managed by the backend once the FastAPI service is connected.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title="Application" icon={Server}>
              <InfoGrid>
                <InfoItem label="Environment" value={settings.data.application.environment} />
                <InfoItem label="Backend" value={settings.data.application.backend} />
                <InfoItem label="API Base URL" value={settings.data.application.apiBaseUrl} mono />
                <InfoItem label="Version" value={settings.data.application.version} mono />
              </InfoGrid>
            </SectionCard>

            <SectionCard title="AI Configuration" icon={BrainCircuit}>
              <InfoGrid>
                <InfoItem label="Model" value={settings.data.ai.model} />
                <InfoItem
                  label="AgentCore"
                  value={<StatusBadge label={settings.data.ai.agentCore} tone="neutral" dot />}
                />
                <InfoItem label="Region" value={settings.data.ai.region} />
              </InfoGrid>
            </SectionCard>

            <SectionCard title="RAG" icon={BookOpen}>
              <InfoGrid>
                <InfoItem label="Knowledge Base" value={settings.data.rag.knowledgeBase} />
                <InfoItem label="Vector Store" value={settings.data.rag.vectorStore} />
                <InfoItem label="Embedding Model" value={settings.data.rag.embeddingModel} />
                <InfoItem label="Top K" value={settings.data.rag.topK} mono />
              </InfoGrid>
            </SectionCard>

            <SectionCard title="Enterprise APIs" icon={Network}>
              <ul className="divide-y">
                {settings.data.enterpriseApis.map((api) => (
                  <li key={api.name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium text-slate-900">{api.name}</span>
                    <StatusBadge
                      label={integrationStatusMeta[api.status].label}
                      tone={integrationStatusMeta[api.status].tone}
                      dot
                    />
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>
      )}
    </>
  );
}
