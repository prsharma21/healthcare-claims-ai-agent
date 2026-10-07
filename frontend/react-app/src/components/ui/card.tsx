import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-lg border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-start justify-between gap-3 border-b px-4 py-3", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-sm font-semibold leading-6", className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-4 py-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-footer" className={cn("flex items-center gap-2 border-t px-4 py-3", className)} {...props} />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
