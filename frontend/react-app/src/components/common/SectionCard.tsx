import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Card with a titled header. Used for most content blocks in the app. */
export function SectionCard({ title, description, icon: Icon, actions, children, className, contentClassName }: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon && <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
}
