import { DonutChart } from "@/components/charts/DonutChart";
import type { StatusCount } from "@/types/analytics";
import { claimStatusMeta } from "@/utils/status";

export function ClaimsStatusChart({ data }: { data: StatusCount[] }) {
  return (
    <DonutChart
      label="Claims by status"
      centerLabel="Claims"
      data={data.map((item) => ({
        name: claimStatusMeta[item.status].label,
        value: item.count,
        color: claimStatusMeta[item.status].color,
      }))}
    />
  );
}
