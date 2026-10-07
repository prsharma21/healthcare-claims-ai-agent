import type { ReactNode } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const dotColors: Record<BadgeTone, string> = {
  neutral: "bg-slate-400",
  info: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-amber-500",
  alert: "bg-orange-500",
  danger: "bg-red-600",
  outline: "bg-slate-400",
};

interface StatusBadgeProps {
  label: string;
  tone: BadgeTone;
  icon?: ReactNode;
  /** Shows a small colored dot instead of an icon. */
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

/** Generic colored status pill. Domain badges (claim, risk, agent) build on this. */
export function StatusBadge({ label, tone, icon, dot = false, pulse = false, className }: StatusBadgeProps) {
  return (
    <Badge tone={tone} className={className}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn("inline-block size-1.5 rounded-full", dotColors[tone], pulse && "animate-pulse")}
        />
      )}
      {icon}
      {label}
    </Badge>
  );
}
