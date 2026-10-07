import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
