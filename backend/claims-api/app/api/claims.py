from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from app.dependencies import get_claim_document_storage, get_claim_service
from app.schemas.claim import (
    ClaimCreateRequest,
    ClaimListResponse,
    ClaimResponse,
    ClaimStatus,
    ClaimUploadDetails,
    ClaimUploadResponse,
    OptionalClaimType,
    OptionalPatientId,
    OptionalPayerId,
    OptionalProviderId,
)
from app.services.claim_service import ClaimNotFoundError, ClaimService
from app.services.s3_service import (
    PDF_CONTENT_TYPE,
    ClaimDocumentStorage,
    ClaimDocumentUploadError,
    InvalidDocumentNameError,
)

router = APIRouter(prefix="/claims", tags=["claims"])

ClaimServiceDep = Annotated[ClaimService, Depends(get_claim_service)]
ClaimDocumentStorageDep = Annotated[ClaimDocumentStorage, Depends(get_claim_document_storage)]

MAX_CLAIM_DOCUMENT_BYTES = 10 * 1024 * 1024
PDF_SIGNATURE = b"%PDF-"
ONLY_PDF_MESSAGE = "Only PDF files are supported"


def _file_size(file: UploadFile) -> int:
    if file.size is not None:
        return file.size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    return size


def _ensure_pdf_document(file: UploadFile) -> None:
    """Accept only non-empty PDFs up to 10 MB: checks the declared content type and the %PDF- file signature."""
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type != PDF_CONTENT_TYPE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=ONLY_PDF_MESSAGE)

    size = _file_size(file)
    if size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty")
    if size > MAX_CLAIM_DOCUMENT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Claim documents must be 10 MB or smaller",
        )

    signature = file.file.read(len(PDF_SIGNATURE))
    file.file.seek(0)
    if signature != PDF_SIGNATURE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=ONLY_PDF_MESSAGE)


@router.post(
    "",
    response_model=ClaimResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new healthcare claim",
    description="Registers a claim and returns it with a generated claim ID (CLM10001, CLM10002, ...) "
    "and the initial status RECEIVED.",
    responses={422: {"description": "The request body is invalid."}},
)
def create_claim(request: ClaimCreateRequest, service: ClaimServiceDep) -> ClaimResponse:
    return ClaimResponse.model_validate(service.create_claim(request))


@router.post(
    "/upload",
    response_model=ClaimUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a claim document",
    description="Creates a claim with the next claim ID and stores the PDF privately in Amazon S3 at "
    "incoming/{claim_id}/{filename}. The claim starts in the UPLOADED status. Patient, provider, payer and "
    "claim type are optional form fields.",
    responses={
        400: {"description": "Not a PDF, empty, or the file name is unusable.", "content": {"application/json": {"example": {"detail": ONLY_PDF_MESSAGE}}}},
        413: {"description": "The file is larger than 10 MB."},
        500: {"description": "S3 rejected the upload.", "content": {"application/json": {"example": {"detail": "Failed to upload claim document to S3"}}}},
        503: {"description": "S3 storage is not configured (S3_BUCKET_NAME)."},
    },
)
def upload_claim_document(
    file: Annotated[UploadFile, File(description="Claim document (PDF, up to 10 MB).")],
    service: ClaimServiceDep,
    storage: ClaimDocumentStorageDep,
    patient_id: Annotated[OptionalPatientId, Form(description="Optional patient identifier, for example PAT10001.")] = None,
    provider_id: Annotated[OptionalProviderId, Form(description="Optional provider identifier, for example PRV10001.")] = None,
    payer_id: Annotated[OptionalPayerId, Form(description="Optional payer identifier, for example PAY10001.")] = None,
    claim_type: Annotated[OptionalClaimType, Form(description="Optional claim type.")] = None,
) -> ClaimUploadResponse:
    _ensure_pdf_document(file)
    details = ClaimUploadDetails(patient_id=patient_id, provider_id=provider_id, payer_id=payer_id, claim_type=claim_type)

    try:
        claim = service.create_claim_from_document(
            document=file.file,
            filename=file.filename or "",
            details=details,
            storage=storage,
        )
    except InvalidDocumentNameError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The file name is not valid") from error
    except ClaimDocumentUploadError as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)) from error

    return ClaimUploadResponse(
        claim_id=claim.claim_id,
        filename=claim.document_name,
        s3_bucket=storage.bucket_name,
        s3_object_key=claim.s3_object_key or "",
        status=claim.status,
    )


@router.get(
    "",
    response_model=ClaimListResponse,
    summary="List healthcare claims",
    description="Returns claims, newest first. Filter by status and page with limit/offset.",
)
def list_claims(
    service: ClaimServiceDep,
    claim_status: Annotated[ClaimStatus | None, Query(alias="status", description="Only return claims with this status.")] = None,
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum number of claims to return.")] = 50,
    offset: Annotated[int, Query(ge=0, description="Number of claims to skip.")] = 0,
) -> ClaimListResponse:
    claims, total = service.list_claims(status=claim_status, limit=limit, offset=offset)
    return ClaimListResponse(claims=[ClaimResponse.model_validate(claim) for claim in claims], total=total)


@router.get(
    "/{claim_id}",
    response_model=ClaimResponse,
    summary="Get claim by ID",
    description="Returns a single claim.",
    responses={404: {"description": "Claim not found.", "content": {"application/json": {"example": {"detail": "Claim CLM10001 not found"}}}}},
)
def get_claim(claim_id: str, service: ClaimServiceDep) -> ClaimResponse:
    try:
        return ClaimResponse.model_validate(service.get_claim(claim_id))
    except ClaimNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
