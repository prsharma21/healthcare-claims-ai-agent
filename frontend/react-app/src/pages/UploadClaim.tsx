import { useState } from "react";
import { FileUp } from "lucide-react";

import { ApiClaimsTable } from "@/components/claims/ApiClaimsTable";
import { ClaimLifecycleCard } from "@/components/claims/ClaimLifecycleCard";
import { CreatedClaimCard, type UploadedClaim } from "@/components/claims/CreatedClaimCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Card } from "@/components/ui/card";
import { CreateClaimForm } from "@/components/upload/CreateClaimForm";

export default function UploadClaim() {
  const [createdClaim, setCreatedClaim] = useState<UploadedClaim | null>(null);
  const [claimsRefreshKey, setClaimsRefreshKey] = useState(0);

  const handleCreated = (claim: UploadedClaim) => {
    setCreatedClaim(claim);
    setClaimsRefreshKey((key) => key + 1);
  };

  return (
    <>
      <PageHeader title="Submit New Claim" description="Upload the claim PDF to the claims API. It is stored in Amazon S3 and the claim starts in the Uploaded status." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          {createdClaim ? (
            <CreatedClaimCard claim={createdClaim} onCreateAnother={() => setCreatedClaim(null)} />
          ) : (
            <Card>
              <CreateClaimForm onCreated={handleCreated} />
            </Card>
          )}
          <ApiClaimsTable refreshKey={claimsRefreshKey} />
        </div>

        <div className="flex flex-col gap-5">
          <ClaimLifecycleCard />
          <SectionCard title="Document requirements" icon={FileUp}>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              <li>PDF format only, up to 10 MB</li>
              <li>Itemized bill with CPT and ICD-10 codes</li>
              <li>Prior authorization letter, where required</li>
              <li>Signed by the attending physician</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
