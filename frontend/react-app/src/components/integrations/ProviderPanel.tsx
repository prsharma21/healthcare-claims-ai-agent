import { Hospital } from "lucide-react";

import { ExpandablePanel } from "@/components/common/ExpandablePanel";
import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { ApiCall } from "@/types/integration";
import type { Provider } from "@/types/provider";
import { humanize } from "@/utils/format";

import { ApiCallList } from "./ApiCallList";

export function ProviderPanel({ provider, calls }: { provider: Provider; calls: ApiCall[] }) {
  return (
    <ExpandablePanel
      title="Mock Provider"
      subtitle={`${provider.name} · ${provider.id}`}
      icon={<Hospital className="size-4" aria-hidden="true" />}
      aside={<StatusBadge label={humanize(provider.networkStatus)} tone={provider.networkStatus === "IN_NETWORK" ? "success" : "warning"} />}
    >
      <InfoGrid columns={3}>
        <InfoItem label="Provider" value={provider.name} hint={provider.id} />
        <InfoItem label="Type" value={humanize(provider.type)} />
        <InfoItem label="Registration" value={provider.registrationNumber} mono />
        <InfoItem label="Network Status" value={humanize(provider.networkStatus)} />
        <InfoItem
          label="License"
          value={<StatusBadge label={humanize(provider.licenseStatus)} tone={provider.licenseStatus === "ACTIVE" ? "success" : "danger"} />}
        />
        <InfoItem label="Specialties" value={provider.specialties.join(", ")} />
      </InfoGrid>
      <div className="mt-5">
        <ApiCallList calls={calls} />
      </div>
    </ExpandablePanel>
  );
}
