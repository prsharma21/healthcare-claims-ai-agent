import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisTickStyle, chartColors, tooltipStyle } from "./chartTheme";
import type { BarDatum } from "./HorizontalBarChart";
import { useChartAnimation } from "./useChartAnimation";

interface VerticalBarChartProps {
  data: BarDatum[];
  label: string;
  valueFormatter: (value: number) => string;
  seriesName: string;
  height?: number;
  yDomain?: [number, number];
  referenceValue?: { value: number; label: string };
}

export function VerticalBarChart({ data, label, valueFormatter, seriesName, height = 240, yDomain, referenceValue }: VerticalBarChartProps) {
  const animate = useChartAnimation();
  return (
    <figure aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={axisTickStyle} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} domain={yDomain} tickFormatter={(value: number) => valueFormatter(value)} />
          <Tooltip formatter={(value) => [valueFormatter(Number(value)), seriesName]} cursor={{ fill: "#f1f5f9" }} {...tooltipStyle} />
          {referenceValue && (
            <ReferenceLine
              y={referenceValue.value}
              stroke={chartColors.axis}
              strokeDasharray="4 4"
              label={{ value: referenceValue.label, position: "insideTopRight", fontSize: 11, fill: chartColors.axis }}
            />
          )}
          <Bar dataKey="value" name={seriesName} radius={[3, 3, 0, 0]} maxBarSize={48} isAnimationActive={animate}>
            {data.map((item) => (
              <Cell key={item.name} fill={item.color ?? chartColors.blue} />
            ))}
            <LabelList dataKey="value" position="top" formatter={(value: unknown) => valueFormatter(Number(value))} style={{ fontSize: 11, fill: "#334155" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
