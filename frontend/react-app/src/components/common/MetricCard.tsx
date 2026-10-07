import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MetricAccent = "blue" | "green" | "red" | "amber" | "orange" | "slate";

const accentClasses: Record<MetricAccent, string> = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  orange: "bg-orange-50 text-orange-700",
  slate: "bg-slate-100 text-slate-600",
};

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: MetricAccent;
  /** Small line under the value, for example a target or trend. */
  helper?: ReactNode;
  to?: string;
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, accent = "blue", helper, to, className }: MetricCardProps) {
  const content = (
    <Card className={cn("flex h-full items-start justify-between gap-3 p-4", to && "transition-colors hover:border-blue-300", className)}>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        {helper && <div className="mt-1 text-xs text-muted-foreground">{helper}</div>}
      </div>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", accentClasses[accent])}>
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
    </Card>
  );

  if (!to) return content;
  return (
    <Link to={to} className="block rounded-lg" aria-label={`${label}: ${value}. View claims`}>
      {content}
    </Link>
  );
}
