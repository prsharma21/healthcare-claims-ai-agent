from threading import Lock
from typing import Protocol

CLAIM_ID_PREFIX = "CLM"
FIRST_CLAIM_NUMBER = 10001


def format_claim_id(number: int) -> str:
    return f"{CLAIM_ID_PREFIX}{number}"


class ClaimIdGenerator(Protocol):
    def next_id(self) -> str: ...


class SequentialClaimIdGenerator:
    """In-memory sequence: CLM10001, CLM10002, ...

    With PostgreSQL, replace this with a generator that reads nextval() from a sequence
    created with START WITH 10001.
    """

    def __init__(self, start: int = FIRST_CLAIM_NUMBER) -> None:
        self._next_number = start
        self._lock = Lock()

    def next_id(self) -> str:
        with self._lock:
            number = self._next_number
            self._next_number += 1
        return format_claim_id(number)
