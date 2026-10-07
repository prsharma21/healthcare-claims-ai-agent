import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisTickStyle, chartColors, tooltipStyle } from "./chartTheme";
import { useChartAnimation } from "./useChartAnimation";

export interface BarDatum {
  name: string;
  value: number;
  color?: string;
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  label: string;
  valueFormatter: (value: number) => string;
  seriesName: string;
  height?: number;
}

export function HorizontalBarChart({ data, label, valueFormatter, seriesName, height = 240 }: HorizontalBarChartProps) {
  const animate = useChartAnimation();
  return (
    <figure aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={(value: number) => valueFormatter(value)} />
          <YAxis type="category" dataKey="name" width={110} tick={axisTickStyle} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [valueFormatter(Number(value)), seriesName]} cursor={{ fill: "#f1f5f9" }} {...tooltipStyle} />
          <Bar dataKey="value" name={seriesName} radius={[0, 3, 3, 0]} barSize={18} isAnimationActive={animate}>
            {data.map((item) => (
              <Cell key={item.name} fill={item.color ?? chartColors.blue} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(value: unknown) => valueFormatter(Number(value))} style={{ fontSize: 11, fill: "#334155" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
