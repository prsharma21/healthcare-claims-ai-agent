from dataclasses import replace
from threading import Lock
from typing import Protocol

from app.models.claim import Claim
from app.schemas.claim import ClaimStatus


class ClaimRepository(Protocol):
    """Storage for claims. A PostgreSQL implementation can replace the in-memory one."""

    def add(self, claim: Claim) -> Claim: ...

    def get(self, claim_id: str) -> Claim | None: ...

    def list(self, *, status: ClaimStatus | None, limit: int, offset: int) -> tuple[list[Claim], int]:
        """Returns one page of claims (newest first) and the total number of matching claims."""
        ...


class InMemoryClaimRepository:
    """Process-local storage. Data is lost when the API restarts."""

    def __init__(self) -> None:
        self._claims: dict[str, Claim] = {}
        self._lock = Lock()

    def add(self, claim: Claim) -> Claim:
        with self._lock:
            if claim.claim_id in self._claims:
                raise ValueError(f"Claim {claim.claim_id} already exists")
            self._claims[claim.claim_id] = replace(claim)
        return replace(claim)

    def get(self, claim_id: str) -> Claim | None:
        with self._lock:
            claim = self._claims.get(claim_id)
        return replace(claim) if claim else None

    def list(self, *, status: ClaimStatus | None, limit: int, offset: int) -> tuple[list[Claim], int]:
        with self._lock:
            claims = [claim for claim in self._claims.values() if status is None or claim.status == status]
        claims.reverse()
        return [replace(claim) for claim in claims[offset : offset + limit]], len(claims)
