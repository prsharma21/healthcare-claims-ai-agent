import re
from datetime import datetime
from enum import StrEnum
from typing import Annotated

from pydantic import AfterValidator, BaseModel, BeforeValidator, ConfigDict, Field


class ClaimStatus(StrEnum):
    """Claim lifecycle: RECEIVED | UPLOADED -> PROCESSING -> APPROVED | DENIED | REQUEST_INFORMATION | FRAUD_REVIEW.

    RECEIVED: registered with POST /claims (document name only). UPLOADED: document stored in S3 by
    POST /claims/upload. FAILED marks a claim whose processing could not be completed.
    """

    RECEIVED = "RECEIVED"
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    REQUEST_INFORMATION = "REQUEST_INFORMATION"
    FRAUD_REVIEW = "FRAUD_REVIEW"
    FAILED = "FAILED"


class ClaimType(StrEnum):
    INPATIENT = "INPATIENT"
    OUTPATIENT = "OUTPATIENT"
    EMERGENCY = "EMERGENCY"
    PHARMACY = "PHARMACY"


def _identifier(prefix_pattern: str, example: str):
    pattern = re.compile(rf"^{prefix_pattern}\d{{4,12}}$")

    def validate(value: str) -> str:
        value = value.strip().upper()
        if not pattern.fullmatch(value):
            raise ValueError(f"must look like {example}")
        return value

    return AfterValidator(validate)


def _validate_document_name(value: str) -> str:
    value = value.strip()
    if "/" in value or "\\" in value:
        raise ValueError("must be a file name, not a path")
    if not value.lower().endswith(".pdf") or len(value) <= len(".pdf"):
        raise ValueError("must be a PDF file name, for example claim_10001.pdf")
    return value


def _blank_to_none(value: object) -> object:
    return None if isinstance(value, str) and not value.strip() else value


PatientId = Annotated[str, _identifier("PAT", "PAT10001")]
ProviderId = Annotated[str, _identifier("PRO?V", "PRV10001")]
PayerId = Annotated[str, _identifier("PAY", "PAY10001")]
DocumentName = Annotated[str, Field(min_length=5, max_length=255), AfterValidator(_validate_document_name)]

# Optional multipart form fields: an empty value means "not provided".
OptionalPatientId = Annotated[PatientId | None, BeforeValidator(_blank_to_none)]
OptionalProviderId = Annotated[ProviderId | None, BeforeValidator(_blank_to_none)]
OptionalPayerId = Annotated[PayerId | None, BeforeValidator(_blank_to_none)]
OptionalClaimType = Annotated[ClaimType | None, BeforeValidator(_blank_to_none)]


class ClaimCreateRequest(BaseModel):
    """Payload for creating a claim. The claim ID and status are assigned by the API."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "patient_id": "PAT10001",
                    "provider_id": "PRV10001",
                    "payer_id": "PAY10001",
                    "claim_type": "OUTPATIENT",
                    "document_name": "claim_10001.pdf",
                }
            ]
        },
    )

    patient_id: PatientId = Field(description="Patient identifier, for example PAT10001.")
    provider_id: ProviderId = Field(description="Provider identifier, for example PRV10001.")
    payer_id: PayerId = Field(description="Payer identifier, for example PAY10001.")
    claim_type: ClaimType = Field(description="Type of claim.")
    document_name: DocumentName = Field(description="File name of the claim document (PDF).")


class ClaimUploadDetails(BaseModel):
    """Optional claim details sent as form fields with POST /claims/upload."""

    patient_id: OptionalPatientId = None
    provider_id: OptionalProviderId = None
    payer_id: OptionalPayerId = None
    claim_type: OptionalClaimType = None


class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    claim_id: str = Field(examples=["CLM10001"])
    patient_id: str | None = Field(examples=["PAT10001"])
    provider_id: str | None = Field(examples=["PRV10001"])
    payer_id: str | None = Field(examples=["PAY10001"])
    claim_type: ClaimType | None
    document_name: str = Field(examples=["claim_10001.pdf"])
    status: ClaimStatus
    created_at: datetime
    s3_bucket: str | None = Field(default=None, description="Bucket holding the claim document, once uploaded.")
    s3_object_key: str | None = Field(
        default=None,
        description="S3 object key of the claim document, once uploaded.",
        examples=["incoming/CLM10001/claim_10001.pdf"],
    )


class ClaimUploadResponse(BaseModel):
    claim_id: str = Field(examples=["CLM10001"])
    filename: str = Field(description="Stored file name (unsafe characters replaced).", examples=["claim_10001.pdf"])
    s3_bucket: str = Field(examples=["healthcare-claims-ai-dev-2026"])
    s3_object_key: str = Field(examples=["incoming/CLM10001/claim_10001.pdf"])
    status: ClaimStatus = Field(examples=[ClaimStatus.UPLOADED])


class ClaimListResponse(BaseModel):
    claims: list[ClaimResponse]
    total: int = Field(description="Number of claims matching the filters, before limit/offset are applied.")
