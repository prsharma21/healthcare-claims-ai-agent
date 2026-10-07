import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "border-slate-200 bg-slate-100 text-slate-700",
        info: "border-blue-200 bg-blue-50 text-blue-800",
        success: "border-green-200 bg-green-50 text-green-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        alert: "border-orange-200 bg-orange-50 text-orange-800",
        danger: "border-red-200 bg-red-50 text-red-800",
        outline: "border-input bg-card text-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge };
export type { BadgeTone };
