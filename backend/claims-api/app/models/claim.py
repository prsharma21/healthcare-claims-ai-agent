from dataclasses import dataclass
from datetime import datetime

from app.schemas.claim import ClaimStatus, ClaimType


@dataclass
class Claim:
    """A claim as stored by the claims repository.

    Claims created from a document upload may not have patient/provider/payer details yet.
    """

    claim_id: str
    patient_id: str | None
    provider_id: str | None
    payer_id: str | None
    claim_type: ClaimType | None
    document_name: str
    status: ClaimStatus
    created_at: datetime
    s3_bucket: str | None = None
    s3_object_key: str | None = None
