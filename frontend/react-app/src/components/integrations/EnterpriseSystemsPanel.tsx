import { Network } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { Card } from "@/components/ui/card";
import { useAsync } from "@/hooks/useAsync";
import { claimsService } from "@/services/claimsService";

import { CodingPanel } from "./CodingPanel";
import { EHRPanel } from "./EHRPanel";
import { IntegrationStatusCard } from "./IntegrationStatusCard";
import { PayerPanel } from "./PayerPanel";
import { ProviderPanel } from "./ProviderPanel";

interface EnterpriseSystemsPanelProps {
  claimId: string;
  refreshKey?: string | null;
}

export function EnterpriseSystemsPanel({ claimId, refreshKey }: EnterpriseSystemsPanelProps) {
  const { data, error, isLoading, reload } = useAsync(() => claimsService.getEnterpriseStatus(claimId), [claimId, refreshKey]);

  if (isLoading && !data) {
    return (
      <Card>
        <LoadingState message="Checking enterprise systems..." rows={3} />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <ErrorState title="Unable to load enterprise systems." error={error} onRetry={reload} />
      </Card>
    );
  }

  const { systems, claimData } = data;

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="integrations-heading">
        <h3 id="integrations-heading" className="mb-3 text-sm font-semibold text-slate-900">
          Enterprise Integrations
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {systems.map((system) => (
            <IntegrationStatusCard key={system.id} system={system} calls={claimData?.calls[system.id]} />
          ))}
        </div>
      </section>

      <section aria-labelledby="integration-details-heading" className="flex flex-col gap-3">
        <h3 id="integration-details-heading" className="text-sm font-semibold text-slate-900">
          Responses for this claim
        </h3>
        {claimData ? (
          <>
            <EHRPanel patient={claimData.ehr} calls={claimData.calls.EHR} />
            <PayerPanel payer={claimData.payer} calls={claimData.calls.PAYER} />
            <ProviderPanel provider={claimData.provider} calls={claimData.calls.PROVIDER} />
            <CodingPanel codes={claimData.coding} calls={claimData.calls.CODING} />
          </>
        ) : (
          <Card>
            <EmptyState
              icon={Network}
              title="No enterprise verification yet."
              description="EHR, payer, provider and coding systems are queried during the Enterprise Verification step of AI processing."
            />
          </Card>
        )}
      </section>
    </div>
  );
}
