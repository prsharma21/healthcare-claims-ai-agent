import { CheckCircle2, UploadCloud } from "lucide-react";

import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ClaimUploadDetails, ClaimUploadResult } from "@/types/claimApi";
import { apiClaimStatusMeta, apiClaimTypeLabels } from "@/utils/status";

/** Result of POST /claims/upload plus the details the user submitted with it. */
export interface UploadedClaim {
  upload: ClaimUploadResult;
  details: ClaimUploadDetails;
}

interface CreatedClaimCardProps {
  claim: UploadedClaim;
  onCreateAnother: () => void;
}

export function CreatedClaimCard({ claim: { upload, details }, onCreateAnother }: CreatedClaimCardProps) {
  const status = apiClaimStatusMeta[upload.status];

  return (
    <Card role="status" aria-live="polite" className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-green-200 bg-green-50 px-5 py-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-green-900">Claim Created Successfully</h2>
          <p className="text-sm text-green-800">
            The claim document was uploaded to Amazon S3. The claim is waiting for AI processing.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Claim ID</p>
            <p className="font-mono text-2xl font-semibold text-slate-900">{upload.claim_id}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <StatusBadge label={upload.status} tone={status.tone} dot />
          </div>
        </div>

        <div className="rounded-lg border bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">S3 Object</p>
          <p className="break-all font-mono text-sm text-slate-900">{upload.s3_object_key}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bucket <span className="font-mono">{upload.s3_bucket}</span> · private
          </p>
        </div>

        <InfoGrid columns={3}>
          <InfoItem label="Patient" value={details.patient_id ?? "—"} mono />
          <InfoItem label="Provider" value={details.provider_id ?? "—"} mono />
          <InfoItem label="Payer" value={details.payer_id ?? "—"} mono />
          <InfoItem label="Claim Type" value={details.claim_type ? apiClaimTypeLabels[details.claim_type] : "—"} />
          <InfoItem label="Document" value={upload.filename} />
        </InfoGrid>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={onCreateAnother}>
            <UploadCloud aria-hidden="true" /> Upload Another Claim
          </Button>
        </div>
      </div>
    </Card>
  );
}
