import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InfoItemProps {
  label: string;
  value: ReactNode;
  /** Secondary text under the value, for example an ID. */
  hint?: ReactNode;
  mono?: boolean;
  className?: string;
}

/** A label / value pair. Use inside InfoGrid, which renders a <dl>. */
export function InfoItem({ label, value, hint, mono = false, className }: InfoItemProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 break-words text-sm font-medium text-slate-900", mono && "font-mono text-[13px]")}>
        {value}
        {hint && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  );
}

interface InfoGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnClasses = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function InfoGrid({ children, columns = 2, className }: InfoGridProps) {
  return <dl className={cn("grid gap-x-6 gap-y-4", columnClasses[columns], className)}>{children}</dl>;
}
