from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import BinaryIO

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.dependencies import _create_claim_document_storage, get_claim_document_storage, get_claim_service
from app.main import app
from app.repositories.claim_repository import InMemoryClaimRepository
from app.services.claim_id_generator import SequentialClaimIdGenerator
from app.services.claim_service import ClaimService
from app.services.s3_service import ClaimDocumentUploadError, build_claim_document_key

BUCKET = "claims-test-bucket"
PDF_BYTES = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n"


@dataclass
class FakeDocumentStorage:
    """In-memory ClaimDocumentStorage; records uploads instead of calling S3."""

    bucket_name: str = BUCKET
    objects: dict[str, bytes] = field(default_factory=dict)
    fail: bool = False

    def upload_claim(self, file: BinaryIO, claim_id: str, filename: str) -> str:
        if self.fail:
            raise ClaimDocumentUploadError("Failed to upload claim document to S3")
        key = build_claim_document_key(claim_id, filename)
        self.objects[key] = file.read()
        return key


@pytest.fixture
def storage() -> FakeDocumentStorage:
    return FakeDocumentStorage()


@pytest.fixture
def client(storage: FakeDocumentStorage) -> Iterator[TestClient]:
    service = ClaimService(repository=InMemoryClaimRepository(), id_generator=SequentialClaimIdGenerator())
    app.dependency_overrides[get_claim_service] = lambda: service
    app.dependency_overrides[get_claim_document_storage] = lambda: storage
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def upload(
    client: TestClient,
    filename: str = "claim_10001.pdf",
    content: bytes = PDF_BYTES,
    content_type: str = "application/pdf",
    **form: str,
):
    return client.post("/claims/upload", files={"file": (filename, content, content_type)}, data=form)


def test_upload_stores_pdf_and_returns_uploaded_claim(client: TestClient, storage: FakeDocumentStorage) -> None:
    response = upload(client)

    assert response.status_code == 201, response.text
    assert response.json() == {
        "claim_id": "CLM10001",
        "filename": "claim_10001.pdf",
        "s3_bucket": BUCKET,
        "s3_object_key": "incoming/CLM10001/claim_10001.pdf",
        "status": "UPLOADED",
    }
    assert storage.objects == {"incoming/CLM10001/claim_10001.pdf": PDF_BYTES}


def test_upload_and_create_share_the_claim_id_sequence(client: TestClient) -> None:
    first = upload(client).json()
    created = client.post(
        "/claims",
        json={
            "patient_id": "PAT10001",
            "provider_id": "PRV10001",
            "payer_id": "PAY10001",
            "claim_type": "OUTPATIENT",
            "document_name": "claim_10002.pdf",
        },
    ).json()
    third = upload(client, filename="claim_10003.pdf").json()

    assert [first["claim_id"], created["claim_id"], third["claim_id"]] == ["CLM10001", "CLM10002", "CLM10003"]
    assert created["status"] == "RECEIVED"
    assert created["s3_object_key"] is None
    assert third["s3_object_key"] == "incoming/CLM10003/claim_10003.pdf"


def test_uploaded_claim_is_returned_by_get_and_list(client: TestClient) -> None:
    upload(client, patient_id=" pat10001 ", provider_id="PRV10001", payer_id="PAY10001", claim_type="INPATIENT")

    claim = client.get("/claims/CLM10001").json()
    assert claim["status"] == "UPLOADED"
    assert claim["patient_id"] == "PAT10001"
    assert claim["claim_type"] == "INPATIENT"
    assert claim["document_name"] == "claim_10001.pdf"
    assert claim["s3_bucket"] == BUCKET
    assert claim["s3_object_key"] == "incoming/CLM10001/claim_10001.pdf"

    listing = client.get("/claims", params={"status": "UPLOADED"}).json()
    assert listing["total"] == 1
    assert listing["claims"][0]["claim_id"] == "CLM10001"


def test_upload_without_details_and_with_blank_fields(client: TestClient) -> None:
    response = upload(client, patient_id="", claim_type="")

    assert response.status_code == 201
    claim = client.get("/claims/CLM10001").json()
    assert claim["patient_id"] is None
    assert claim["claim_type"] is None


def test_upload_uses_a_safe_file_name(client: TestClient, storage: FakeDocumentStorage) -> None:
    response = upload(client, filename="..\\scans/John Smith (final).pdf")

    assert response.status_code == 201
    assert response.json()["filename"] == "John_Smith_final_.pdf"
    assert list(storage.objects) == ["incoming/CLM10001/John_Smith_final_.pdf"]


@pytest.mark.parametrize(
    ("filename", "content", "content_type"),
    [
        ("notes.txt", b"plain text", "text/plain"),
        ("image.png", b"\x89PNG\r\n", "image/png"),
        ("fake.pdf", b"not really a pdf", "application/pdf"),
    ],
)
def test_upload_rejects_non_pdf_files(
    client: TestClient, storage: FakeDocumentStorage, filename: str, content: bytes, content_type: str
) -> None:
    response = upload(client, filename=filename, content=content, content_type=content_type)

    assert response.status_code == 400
    assert response.json() == {"detail": "Only PDF files are supported"}
    assert storage.objects == {}


def test_upload_rejects_empty_and_oversized_files(client: TestClient) -> None:
    assert upload(client, content=b"").status_code == 400

    too_big = PDF_BYTES + b"0" * (10 * 1024 * 1024)
    response = upload(client, content=too_big)
    assert response.status_code == 413
    assert response.json() == {"detail": "Claim documents must be 10 MB or smaller"}


def test_upload_rejects_unusable_file_name_without_using_a_claim_id(client: TestClient) -> None:
    assert upload(client, filename="...").status_code == 400
    assert upload(client).json()["claim_id"] == "CLM10001"


def test_upload_requires_a_file(client: TestClient) -> None:
    response = client.post("/claims/upload", data={"patient_id": "PAT10001"})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "file"]


def test_upload_validates_optional_details(client: TestClient, storage: FakeDocumentStorage) -> None:
    response = upload(client, patient_id="X1", claim_type="DENTAL")

    assert response.status_code == 422
    fields = {error["loc"][-1] for error in response.json()["detail"]}
    assert fields == {"patient_id", "claim_type"}
    assert storage.objects == {}


def test_s3_failure_returns_500_without_saving_the_claim(client: TestClient, storage: FakeDocumentStorage) -> None:
    storage.fail = True

    response = upload(client)

    assert response.status_code == 500
    assert response.json() == {"detail": "Failed to upload claim document to S3"}
    assert client.get("/claims").json()["total"] == 0


def test_upload_returns_503_when_bucket_is_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "s3_bucket_name", "")
    _create_claim_document_storage.cache_clear()
    try:
        with TestClient(app) as test_client:
            response = test_client.post("/claims/upload", files={"file": ("claim.pdf", PDF_BYTES, "application/pdf")})
    finally:
        _create_claim_document_storage.cache_clear()

    assert response.status_code == 503
    assert response.json() == {"detail": "Claim document storage is not configured"}


def test_openapi_lists_all_claim_endpoints(client: TestClient) -> None:
    paths = client.get("/openapi.json").json()["paths"]

    assert set(paths["/claims"]) == {"get", "post"}
    assert set(paths["/claims/{claim_id}"]) == {"get"}
    assert paths["/claims/upload"]["post"]["summary"] == "Upload a claim document"
