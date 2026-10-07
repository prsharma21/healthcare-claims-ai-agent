import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/services/apiClient";

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function ErrorState({ title = "Unable to load data.", error, onRetry, actions, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {error !== undefined && error !== null && (
          <p className="mt-1 text-sm text-muted-foreground">{getErrorMessage(error)}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            Retry
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
