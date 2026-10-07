from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_claim_service
from app.main import app
from app.repositories.claim_repository import InMemoryClaimRepository
from app.services.claim_id_generator import SequentialClaimIdGenerator
from app.services.claim_service import ClaimService

VALID_CLAIM = {
    "patient_id": "PAT10001",
    "provider_id": "PRV10001",
    "payer_id": "PAY10001",
    "claim_type": "OUTPATIENT",
    "document_name": "claim_10001.pdf",
}


@pytest.fixture
def client() -> Iterator[TestClient]:
    service = ClaimService(repository=InMemoryClaimRepository(), id_generator=SequentialClaimIdGenerator())
    app.dependency_overrides[get_claim_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def create_claim(client: TestClient, **overrides: str) -> dict:
    response = client.post("/claims", json={**VALID_CLAIM, **overrides})
    assert response.status_code == 201, response.text
    return response.json()


def test_create_claim_returns_201_with_generated_id_and_received_status(client: TestClient) -> None:
    response = client.post("/claims", json=VALID_CLAIM)

    assert response.status_code == 201
    body = response.json()
    assert body["claim_id"].startswith("CLM")
    assert body["claim_id"] == "CLM10001"
    assert body["status"] == "RECEIVED"
    assert {key: body[key] for key in VALID_CLAIM} == VALID_CLAIM
    assert body["created_at"]


def test_claim_ids_are_sequential(client: TestClient) -> None:
    ids = [create_claim(client)["claim_id"] for _ in range(3)]

    assert ids == ["CLM10001", "CLM10002", "CLM10003"]


def test_get_claim_returns_created_claim(client: TestClient) -> None:
    created = create_claim(client)

    response = client.get(f"/claims/{created['claim_id']}")

    assert response.status_code == 200
    assert response.json() == created


def test_get_unknown_claim_returns_404(client: TestClient) -> None:
    response = client.get("/claims/CLM99999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Claim CLM99999 not found"}


def test_list_claims_returns_all_claims_newest_first(client: TestClient) -> None:
    create_claim(client)
    create_claim(client, patient_id="PAT10002")

    response = client.get("/claims")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert [claim["claim_id"] for claim in body["claims"]] == ["CLM10002", "CLM10001"]


def test_list_claims_supports_status_filter_and_pagination(client: TestClient) -> None:
    for _ in range(3):
        create_claim(client)

    page = client.get("/claims", params={"limit": 2, "offset": 1}).json()
    assert page["total"] == 3
    assert [claim["claim_id"] for claim in page["claims"]] == ["CLM10002", "CLM10001"]

    assert client.get("/claims", params={"status": "RECEIVED"}).json()["total"] == 3
    assert client.get("/claims", params={"status": "APPROVED"}).json() == {"claims": [], "total": 0}
    assert client.get("/claims", params={"status": "UNKNOWN"}).status_code == 422
    assert client.get("/claims", params={"limit": 0}).status_code == 422


def test_list_claims_is_empty_initially(client: TestClient) -> None:
    assert client.get("/claims").json() == {"claims": [], "total": 0}


def test_identifiers_are_normalized(client: TestClient) -> None:
    body = create_claim(client, patient_id=" pat10001 ", provider_id="prov1001")

    assert body["patient_id"] == "PAT10001"
    assert body["provider_id"] == "PROV1001"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("patient_id", "10001"),
        ("provider_id", "PAT10001"),
        ("payer_id", ""),
        ("claim_type", "SURGERY"),
        ("document_name", "claim.docx"),
        ("document_name", "../etc/claim.pdf"),
    ],
)
def test_invalid_field_returns_422(client: TestClient, field: str, value: str) -> None:
    response = client.post("/claims", json={**VALID_CLAIM, field: value})

    assert response.status_code == 422
    assert any(error["loc"] == ["body", field] for error in response.json()["detail"])


def test_missing_fields_and_client_supplied_id_are_rejected(client: TestClient) -> None:
    missing = client.post("/claims", json={"patient_id": "PAT10001"})
    assert missing.status_code == 422
    assert {tuple(error["loc"]) for error in missing.json()["detail"]} >= {
        ("body", "provider_id"),
        ("body", "payer_id"),
        ("body", "claim_type"),
        ("body", "document_name"),
    }

    with_id = client.post("/claims", json={**VALID_CLAIM, "claim_id": "CLM55555"})
    assert with_id.status_code == 422


def test_cors_allows_the_react_dev_server(client: TestClient) -> None:
    response = client.options(
        "/claims",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rejects_unknown_origins(client: TestClient) -> None:
    response = client.options(
        "/claims",
        headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"},
    )

    assert "access-control-allow-origin" not in response.headers
