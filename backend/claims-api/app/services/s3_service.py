import logging
import re
from pathlib import PurePosixPath
from typing import BinaryIO, Protocol

import boto3
from boto3.exceptions import S3UploadFailedError
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)

CLAIM_DOCUMENT_PREFIX = "incoming"
PDF_CONTENT_TYPE = "application/pdf"

_CLAIM_ID_PATTERN = re.compile(r"^CLM\d+$")
_UNSAFE_KEY_CHARACTERS = re.compile(r"[^A-Za-z0-9._-]+")


class S3ConfigurationError(RuntimeError):
    """Raised when document storage is used without the required S3 settings."""


class InvalidDocumentNameError(ValueError):
    """Raised when an uploaded file name has nothing usable for an object key."""


class ClaimDocumentUploadError(RuntimeError):
    """Raised when S3 rejects or cannot complete an upload. The AWS error is logged and chained."""


class ClaimDocumentStorage(Protocol):
    """Stores claim documents. Implemented by S3 now; a local or fake store can replace it in tests."""

    @property
    def bucket_name(self) -> str: ...

    def upload_claim(self, file: BinaryIO, claim_id: str, filename: str) -> str: ...


def safe_document_name(filename: str) -> str:
    """Reduce a client-supplied file name to a base name that is safe to use in an object key."""
    base_name = PurePosixPath(filename.replace("\\", "/")).name
    safe_name = _UNSAFE_KEY_CHARACTERS.sub("_", base_name).strip("._")
    if not safe_name:
        raise InvalidDocumentNameError(f"Invalid document file name: {filename!r}")
    return safe_name


def build_claim_document_key(claim_id: str, filename: str) -> str:
    """Return `incoming/{claim_id}/{filename}`, for example `incoming/CLM10001/claim_10001.pdf`."""
    if not _CLAIM_ID_PATTERN.fullmatch(claim_id):
        raise ValueError(f"Invalid claim ID: {claim_id!r}")
    return f"{CLAIM_DOCUMENT_PREFIX}/{claim_id}/{safe_document_name(filename)}"


def create_s3_client(region_name: str) -> BaseClient:
    return boto3.client(
        "s3",
        region_name=region_name,
        config=Config(retries={"mode": "standard"}, connect_timeout=5, read_timeout=60),
    )


class S3ClaimDocumentStorage:
    def __init__(self, client: BaseClient, bucket_name: str) -> None:
        if not bucket_name:
            raise S3ConfigurationError("S3_BUCKET_NAME is not set; claim documents cannot be stored.")
        self._client = client
        self._bucket_name = bucket_name

    @property
    def bucket_name(self) -> str:
        return self._bucket_name

    def upload_claim(self, file: BinaryIO, claim_id: str, filename: str) -> str:
        """Upload a claim PDF (private, bucket-default encryption) and return its object key."""
        object_key = build_claim_document_key(claim_id, filename)
        try:
            self._client.upload_fileobj(
                file,
                self._bucket_name,
                object_key,
                ExtraArgs={"ContentType": PDF_CONTENT_TYPE},
            )
        except (BotoCoreError, ClientError, S3UploadFailedError) as error:
            logger.exception("S3 upload failed for claim %s (bucket %s)", claim_id, self._bucket_name)
            raise ClaimDocumentUploadError("Failed to upload claim document to S3") from error

        logger.info("Stored document for claim %s at s3://%s/%s", claim_id, self._bucket_name, object_key)
        return object_key
