import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  /** Number of skeleton rows to show under the message. */
  rows?: number;
  className?: string;
}

export function LoadingState({ message = "Loading...", rows = 0, className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-3 py-8", className)}>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {rows > 0 && (
        <div className="flex flex-col gap-2 px-4" aria-hidden="true">
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
