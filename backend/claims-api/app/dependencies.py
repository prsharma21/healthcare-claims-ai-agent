import logging
from functools import lru_cache

from fastapi import HTTPException, status

from app.config import settings
from app.repositories.claim_repository import InMemoryClaimRepository
from app.services.claim_id_generator import SequentialClaimIdGenerator
from app.services.claim_service import ClaimService
from app.services.s3_service import ClaimDocumentStorage, S3ClaimDocumentStorage, S3ConfigurationError, create_s3_client

logger = logging.getLogger(__name__)


@lru_cache
def get_claim_service() -> ClaimService:
    """One service (and in-memory store) per process. Tests override this dependency."""
    return ClaimService(repository=InMemoryClaimRepository(), id_generator=SequentialClaimIdGenerator())


@lru_cache
def _create_claim_document_storage() -> S3ClaimDocumentStorage:
    """One S3 client per process (boto3 clients are thread-safe)."""
    return S3ClaimDocumentStorage(create_s3_client(settings.aws_region), settings.s3_bucket_name)


def get_claim_document_storage() -> ClaimDocumentStorage:
    try:
        return _create_claim_document_storage()
    except S3ConfigurationError:
        logger.error("Claim document upload requested, but S3_BUCKET_NAME is not configured.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Claim document storage is not configured",
        ) from None
