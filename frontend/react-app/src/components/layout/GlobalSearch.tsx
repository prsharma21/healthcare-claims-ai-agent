import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ClaimStatusBadge } from "@/components/claims/ClaimStatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { claimsService } from "@/services/claimsService";
import type { Claim } from "@/types/claim";
import { applyClaimFilters } from "@/utils/claimFilters";
import { formatCurrency } from "@/utils/format";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [claims, setClaims] = useState<Claim[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setQuery("");
    claimsService.getClaims().then(
      (result) => active && setClaims(result),
      () => active && setClaims([]),
    );
    return () => {
      active = false;
    };
  }, [open]);

  const results = useMemo(() => {
    if (!claims) return [];
    return applyClaimFilters(claims, { search: query }).slice(0, 8);
  }, [claims, query]);

  const openClaim = (claimId: string) => {
    onOpenChange(false);
    navigate(`/claims/${claimId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] max-w-xl translate-y-0 gap-0 p-0" hideClose>
        <DialogTitle className="sr-only">Search claims</DialogTitle>
        <DialogDescription className="sr-only">Search by claim ID, patient or provider. Press Enter to open the first result.</DialogDescription>
        <form
          className="flex items-center gap-2 border-b px-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (results[0]) openClaim(results[0].id);
          }}
        >
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by claim ID, patient or provider..."
            aria-label="Search claims"
            className="h-12 border-0 px-0 shadow-none focus-visible:outline-0"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            Esc
          </kbd>
        </form>
        <div className="max-h-80 overflow-y-auto p-2">
          {claims === null ? (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading claims...
            </p>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No claims found.</p>
          ) : (
            <ul aria-label="Search results" className="flex flex-col gap-0.5">
              {results.map((claim) => (
                <li key={claim.id}>
                  <button
                    type="button"
                    onClick={() => openClaim(claim.id)}
                    className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-2"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {claim.id} · {claim.patientName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {claim.providerName} · {formatCurrency(claim.amount)}
                      </span>
                    </span>
                    <ClaimStatusBadge status={claim.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
