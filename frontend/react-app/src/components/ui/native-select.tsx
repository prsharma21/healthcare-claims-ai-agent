import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-input bg-card py-1 pl-3 pr-8 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { NativeSelect };
