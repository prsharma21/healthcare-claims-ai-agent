import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisTickStyle, chartColors, tooltipStyle } from "@/components/charts/chartTheme";
import { useChartAnimation } from "@/components/charts/useChartAnimation";
import type { ProcessingTrendPoint } from "@/types/analytics";
import { formatDate, formatDayMonth } from "@/utils/format";

const series = [
  { key: "submitted", name: "Submitted", color: chartColors.blue },
  { key: "approved", name: "Approved", color: chartColors.green },
  { key: "denied", name: "Denied", color: chartColors.red },
  { key: "fraudReview", name: "Fraud Review", color: chartColors.orange },
] as const;

export function ProcessingTrendChart({ data, height = 260 }: { data: ProcessingTrendPoint[]; height?: number }) {
  const animate = useChartAnimation();
  return (
    <figure aria-label="Claims processed per day over the last 7 days" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(value: string) => formatDayMonth(value)} tick={axisTickStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip labelFormatter={(value) => formatDate(String(value))} {...tooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={item.color}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
              isAnimationActive={animate}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
