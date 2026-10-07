import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExpandablePanelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** Shown on the right of the header, for example a status badge. */
  aside?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function ExpandablePanel({ title, subtitle, icon, aside, defaultOpen = false, children, className }: ExpandablePanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <Card className={className}>
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">{title}</span>
          {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
        </span>
        {aside}
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div id={contentId} hidden={!open} className="border-t px-4 py-4">
        {open && children}
      </div>
    </Card>
  );
}
