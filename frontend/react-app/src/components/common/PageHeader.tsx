import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Extra content under the title, for example badges. */
  meta?: ReactNode;
  backTo?: { to: string; label: string };
}

export function PageHeader({ title, description, actions, meta, backTo }: PageHeaderProps) {
  useDocumentTitle(title);

  return (
    <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo.to}
            className="mb-2 inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {backTo.label}
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
