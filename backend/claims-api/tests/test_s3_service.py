import io
from collections.abc import Iterator

import pytest
from botocore.exceptions import ClientError, NoCredentialsError
from botocore.stub import ANY, Stubber

from app.services.s3_service import (
    ClaimDocumentUploadError,
    InvalidDocumentNameError,
    S3ClaimDocumentStorage,
    S3ConfigurationError,
    build_claim_document_key,
    create_s3_client,
)

BUCKET = "claims-test-bucket"


@pytest.fixture
def stubbed_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[tuple[object, Stubber]]:
    # Dummy credentials so botocore can sign the (stubbed) request; nothing is sent to AWS.
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    client = create_s3_client("ap-south-1")
    with Stubber(client) as stubber:
        yield client, stubber


def test_upload_claim_puts_pdf_under_incoming_prefix(stubbed_client: tuple[object, Stubber]) -> None:
    client, stubber = stubbed_client
    stubber.add_response(
        "put_object",
        {"ETag": '"etag"'},
        {
            "Bucket": BUCKET,
            "Key": "incoming/CLM10001/claim_10001.pdf",
            "Body": ANY,
            "ContentType": "application/pdf",
            "ChecksumAlgorithm": ANY,
        },
    )
    storage = S3ClaimDocumentStorage(client, BUCKET)  # type: ignore[arg-type]

    key = storage.upload_claim(io.BytesIO(b"%PDF-1.7 test"), "CLM10001", "claim_10001.pdf")

    assert key == "incoming/CLM10001/claim_10001.pdf"
    stubber.assert_no_pending_responses()


def test_upload_claim_wraps_and_logs_aws_errors(
    stubbed_client: tuple[object, Stubber], caplog: pytest.LogCaptureFixture
) -> None:
    client, stubber = stubbed_client
    stubber.add_client_error("put_object", service_error_code="AccessDenied", http_status_code=403)
    storage = S3ClaimDocumentStorage(client, BUCKET)  # type: ignore[arg-type]

    with pytest.raises(ClaimDocumentUploadError, match="Failed to upload claim document to S3") as raised:
        storage.upload_claim(io.BytesIO(b"%PDF"), "CLM10001", "claim.pdf")

    assert isinstance(raised.value.__cause__, ClientError)
    assert "S3 upload failed for claim CLM10001" in caplog.text


def test_upload_claim_wraps_missing_credentials() -> None:
    class NoCredentialsClient:
        def upload_fileobj(self, *args: object, **kwargs: object) -> None:
            raise NoCredentialsError()

    storage = S3ClaimDocumentStorage(NoCredentialsClient(), BUCKET)  # type: ignore[arg-type]

    with pytest.raises(ClaimDocumentUploadError) as raised:
        storage.upload_claim(io.BytesIO(b"%PDF"), "CLM10001", "claim.pdf")
    assert isinstance(raised.value.__cause__, NoCredentialsError)


def test_storage_requires_a_bucket_name() -> None:
    with pytest.raises(S3ConfigurationError, match="S3_BUCKET_NAME"):
        S3ClaimDocumentStorage(create_s3_client("ap-south-1"), "")


@pytest.mark.parametrize(
    ("filename", "expected_key"),
    [
        ("claim_10001.pdf", "incoming/CLM10001/claim_10001.pdf"),
        ("../../secrets/claim.pdf", "incoming/CLM10001/claim.pdf"),
        ("C:\\Users\\me\\scan 1.pdf", "incoming/CLM10001/scan_1.pdf"),
        ("discharge summary (final).pdf", "incoming/CLM10001/discharge_summary_final_.pdf"),
    ],
)
def test_object_key_uses_a_safe_base_name(filename: str, expected_key: str) -> None:
    assert build_claim_document_key("CLM10001", filename) == expected_key


@pytest.mark.parametrize("filename", ["..", "///", ""])
def test_object_key_rejects_unusable_file_names(filename: str) -> None:
    with pytest.raises(InvalidDocumentNameError):
        build_claim_document_key("CLM10001", filename)


def test_object_key_rejects_invalid_claim_ids() -> None:
    with pytest.raises(ValueError, match="Invalid claim ID"):
        build_claim_document_key("../CLM1", "a.pdf")
