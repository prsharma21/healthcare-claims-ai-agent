import { FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");

  return (
    <Card className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <FileQuestion className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-base font-semibold text-slate-900">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">The page you are looking for does not exist or has moved.</p>
      </div>
      <Button asChild size="sm">
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </Card>
  );
}
