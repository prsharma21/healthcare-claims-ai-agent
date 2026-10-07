import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatNumber, formatPercent } from "@/utils/format";

import { tooltipStyle } from "./chartTheme";
import { useChartAnimation } from "./useChartAnimation";

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  /** Accessible summary of the chart. */
  label: string;
  centerLabel?: string;
  valueFormatter?: (value: number) => string;
}

/** Donut chart with an HTML legend that lists every value (readable without the chart). */
export function DonutChart({ data, label, centerLabel, valueFormatter = formatNumber }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const animate = useChartAnimation();

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <figure className="relative h-48 w-48 shrink-0" aria-label={label}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={animate}
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => valueFormatter(Number(value))} {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums">{valueFormatter(total)}</span>
          {centerLabel && <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{centerLabel}</span>}
        </figcaption>
      </figure>
      <ul className="flex w-full flex-col gap-2">
        {data.map((item) => (
          <li key={item.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
            <span className="flex-1 text-slate-700">{item.name}</span>
            <span className="font-semibold tabular-nums">{valueFormatter(item.value)}</span>
            <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
              {total > 0 ? formatPercent(item.value / total, 1) : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
