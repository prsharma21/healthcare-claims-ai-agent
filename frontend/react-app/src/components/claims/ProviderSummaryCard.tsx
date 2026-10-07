import { Hospital } from "lucide-react";

import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Provider } from "@/types/provider";
import { humanize } from "@/utils/format";

export function ProviderSummaryCard({ provider }: { provider: Provider }) {
  return (
    <SectionCard title="Provider Information" icon={Hospital}>
      <InfoGrid>
        <InfoItem label="Provider" value={provider.name} hint={provider.id} />
        <InfoItem label="Type" value={humanize(provider.type)} />
        <InfoItem label="Location" value={`${provider.city}, ${provider.state}`} />
        <InfoItem label="Attending Physician" value={provider.attendingPhysician} />
        <InfoItem
          label="Network"
          value={
            <StatusBadge
              label={humanize(provider.networkStatus)}
              tone={provider.networkStatus === "IN_NETWORK" ? "success" : "warning"}
            />
          }
        />
        <InfoItem label="Registration" value={provider.registrationNumber} mono />
      </InfoGrid>
    </SectionCard>
  );
}
