from collections.abc import Callable
from datetime import UTC, datetime
from typing import BinaryIO

from app.models.claim import Claim
from app.repositories.claim_repository import ClaimRepository
from app.schemas.claim import ClaimCreateRequest, ClaimStatus, ClaimUploadDetails
from app.services.claim_id_generator import ClaimIdGenerator
from app.services.s3_service import ClaimDocumentStorage, safe_document_name


class ClaimNotFoundError(Exception):
    def __init__(self, claim_id: str) -> None:
        super().__init__(f"Claim {claim_id} not found")
        self.claim_id = claim_id


class ClaimService:
    def __init__(
        self,
        repository: ClaimRepository,
        id_generator: ClaimIdGenerator,
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._repository = repository
        self._id_generator = id_generator
        self._clock = clock

    def create_claim(self, request: ClaimCreateRequest) -> Claim:
        """Registers a new claim. Every claim starts in the RECEIVED status."""
        claim = Claim(
            claim_id=self._id_generator.next_id(),
            patient_id=request.patient_id,
            provider_id=request.provider_id,
            payer_id=request.payer_id,
            claim_type=request.claim_type,
            document_name=request.document_name,
            status=ClaimStatus.RECEIVED,
            created_at=self._clock(),
        )
        return self._repository.add(claim)

    def create_claim_from_document(
        self,
        *,
        document: BinaryIO,
        filename: str,
        details: ClaimUploadDetails,
        storage: ClaimDocumentStorage,
    ) -> Claim:
        """Creates a claim (status UPLOADED) whose document is stored at incoming/{claim_id}/{filename}.

        The claim is saved only after the upload succeeds. A failed upload leaves a gap in the claim numbers,
        as a database sequence would.
        """
        document_name = safe_document_name(filename)
        claim_id = self._id_generator.next_id()
        object_key = storage.upload_claim(document, claim_id, document_name)
        claim = Claim(
            claim_id=claim_id,
            patient_id=details.patient_id,
            provider_id=details.provider_id,
            payer_id=details.payer_id,
            claim_type=details.claim_type,
            document_name=document_name,
            status=ClaimStatus.UPLOADED,
            created_at=self._clock(),
            s3_bucket=storage.bucket_name,
            s3_object_key=object_key,
        )
        return self._repository.add(claim)

    def get_claim(self, claim_id: str) -> Claim:
        claim = self._repository.get(claim_id.strip().upper())
        if claim is None:
            raise ClaimNotFoundError(claim_id)
        return claim

    def list_claims(self, *, status: ClaimStatus | None = None, limit: int = 50, offset: int = 0) -> tuple[list[Claim], int]:
        return self._repository.list(status=status, limit=limit, offset=offset)
