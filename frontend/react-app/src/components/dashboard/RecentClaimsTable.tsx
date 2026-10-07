import { useNavigate } from "react-router-dom";

import { ClaimTable } from "@/components/claims/ClaimTable";
import { EmptyState } from "@/components/common/EmptyState";
import type { Claim } from "@/types/claim";

export function RecentClaimsTable({ claims }: { claims: Claim[] }) {
  const navigate = useNavigate();
  return (
    <ClaimTable
      caption="Most recently submitted claims"
      claims={claims}
      columns={["id", "patient", "provider", "payer", "amount", "submitted", "status", "risk", "actions"]}
      onView={(claim) => navigate(`/claims/${claim.id}`)}
      emptyState={<EmptyState title="No claims found." description="Submitted claims will appear here." />}
    />
  );
}
