# Claims API

FastAPI service in `backend/claims-api` that registers healthcare claims and stores claim PDFs in a private
Amazon S3 bucket. Claim records are kept **in memory** for now (they are lost on restart). There is no AI processing
or database yet.

- Base URL (local): `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs` · OpenAPI schema: `http://localhost:8000/openapi.json`

## Endpoints

| Method | Path | Summary | Success |
| --- | --- | --- | --- |
| `POST` | `/claims` | Create a new healthcare claim | `201 Created` → `ClaimResponse` |
| `POST` | `/claims/upload` | Upload a claim document | `201 Created` → `ClaimUploadResponse` |
| `GET` | `/claims/{claim_id}` | Get claim by ID | `200 OK` → `ClaimResponse` |
| `GET` | `/claims` | List healthcare claims | `200 OK` → `ClaimListResponse` |
| `GET` | `/health` | Health check | `200 OK` |

### POST /claims

The server generates the claim ID and sets the status to `RECEIVED`. Clients cannot send `claim_id`, `status` or
`created_at`: unknown fields are rejected with 422.

```http
POST /claims
Content-Type: application/json

{
  "patient_id": "PAT10001",
  "provider_id": "PRV10001",
  "payer_id": "PAY10001",
  "claim_type": "OUTPATIENT",
  "document_name": "claim_10001.pdf"
}
```

```json
HTTP/1.1 201 Created

{
  "claim_id": "CLM10001",
  "patient_id": "PAT10001",
  "provider_id": "PRV10001",
  "payer_id": "PAY10001",
  "claim_type": "OUTPATIENT",
  "document_name": "claim_10001.pdf",
  "status": "RECEIVED",
  "created_at": "2026-10-07T03:42:41.669183Z"
}
```

Validation rules. Identifiers are trimmed and upper-cased before validation, so `" pat10001 "` becomes `PAT10001`.

| Field | Rule |
| --- | --- |
| `patient_id` | `PAT` followed by 4–12 digits, for example `PAT10001` |
| `provider_id` | `PRV` or `PROV` followed by 4–12 digits, for example `PRV10001` |
| `payer_id` | `PAY` followed by 4–12 digits, for example `PAY10001` |
| `claim_type` | `INPATIENT`, `OUTPATIENT`, `EMERGENCY` or `PHARMACY` |
| `document_name` | 5–255 characters, a file name without `/` or `\` that ends in `.pdf` |

### POST /claims/upload

`multipart/form-data` with a required `file` (PDF, up to 10 MB) and the optional form fields `patient_id`,
`provider_id`, `payer_id` and `claim_type` (same rules as above; empty values count as not provided). The API takes
the next claim ID from the same sequence as `POST /claims` and stores the file at `incoming/{claim_id}/{filename}`.
The claim is saved with status `UPLOADED` only after S3 accepts the file.

```bash
curl -F "file=@claim_10001.pdf;type=application/pdf" -F patient_id=PAT10001 http://localhost:8000/claims/upload
```

```json
HTTP/1.1 201 Created

{
  "claim_id": "CLM10001",
  "filename": "claim_10001.pdf",
  "s3_bucket": "healthcare-claims-ai-dev-2026",
  "s3_object_key": "incoming/CLM10001/claim_10001.pdf",
  "status": "UPLOADED"
}
```

| Status | When | Body |
| --- | --- | --- |
| `400` | Content type is not `application/pdf`, or the file does not start with `%PDF-` | `{"detail": "Only PDF files are supported"}` |
| `400` | Empty file / unusable file name | `{"detail": "The uploaded file is empty"}` / `{"detail": "The file name is not valid"}` |
| `413` | Larger than 10 MB | `{"detail": "Claim documents must be 10 MB or smaller"}` |
| `422` | No `file` part, or an invalid optional field | FastAPI validation list |
| `500` | S3 rejected the upload or no AWS credentials (details are logged, not returned) | `{"detail": "Failed to upload claim document to S3"}` |
| `503` | `S3_BUCKET_NAME` is not set | `{"detail": "Claim document storage is not configured"}` |

The file name is reduced to a safe base name: path parts are dropped and characters other than letters, digits,
`.`, `_` and `-` become `_`. For example, `../scans/John Smith.pdf` becomes `John_Smith.pdf`.

Claims returned by `GET /claims` and `GET /claims/{claim_id}` include `s3_bucket` and `s3_object_key`. Both are
`null` for claims created with `POST /claims`. Uploaded claims without details have `null` patient, provider,
payer and claim type.

### GET /claims/{claim_id}

Returns the claim or `404`:

```json
HTTP/1.1 404 Not Found

{ "detail": "Claim CLM10001 not found" }
```

### GET /claims

Returns claims newest first, with the total number of matching claims (before pagination).

| Query parameter | Default | Description |
| --- | --- | --- |
| `status` | — | Filter by status, for example `RECEIVED` |
| `limit` | `50` | Page size, 1–100 |
| `offset` | `0` | Number of claims to skip |

```json
{ "claims": [ { "claim_id": "CLM10002", "status": "RECEIVED", "...": "..." } ], "total": 2 }
```

### Errors

| Status | When | Body |
| --- | --- | --- |
| `404` | Unknown claim ID | `{"detail": "Claim CLM99999 not found"}` |
| `422` | Missing, invalid or unknown fields or query parameters | FastAPI validation list: `{"detail": [{"loc": ["body", "patient_id"], "msg": "...", "type": "..."}]}` |
| `500` | Unexpected server error | Generic message; the React app never shows server details |

## Claim lifecycle

```text
RECEIVED (POST /claims, no document) ──┐
UPLOADED (POST /claims/upload, PDF in S3) ──┴──> PROCESSING ──┬──> APPROVED
                                                              ├──> DENIED
                                                              ├──> REQUEST_INFORMATION
                                                              └──> FRAUD_REVIEW

FAILED: processing could not be completed (technical error); the claim can be retried.
```

Only `RECEIVED` and `UPLOADED` are used today. The AI processing stage will move claims through the other statuses.

## Claim ID generation

IDs are `CLM` followed by a sequential number starting at `10001`, so the first claim is `CLM10001`, then
`CLM10002`, and so on. Generation lives behind the `ClaimIdGenerator` protocol
(`app/services/claim_id_generator.py`), separate from the routes and the repository:

- **Now:** `SequentialClaimIdGenerator` is a thread-safe in-process counter shared by `POST /claims` and
  `POST /claims/upload`. It restarts at `CLM10001` when the service restarts. **Caution:** after a restart, a new
  upload with the same file name as an earlier one overwrites `incoming/CLM10001/...` in S3. This goes away
  with a database sequence. A failed upload uses up its number, leaving a gap, just as a database sequence would.
- **PostgreSQL:** implement `next_id()` with a database sequence so that IDs are unique across restarts and
  instances:

  ```sql
  CREATE SEQUENCE claim_number_seq START WITH 10001;
  SELECT nextval('claim_number_seq');  -- format as 'CLM' || value
  ```

## Code layout

```text
backend/claims-api/app/
├── api/claims.py                     # Routes only: validation, status codes, HTTP errors
├── schemas/claim.py                  # Pydantic models: ClaimCreateRequest, ClaimResponse, ClaimListResponse, enums
├── models/claim.py                   # Claim domain dataclass
├── repositories/claim_repository.py  # ClaimRepository protocol + InMemoryClaimRepository
├── services/claim_service.py         # ClaimService (create, create from document, get, list), ClaimNotFoundError
├── services/claim_id_generator.py    # ClaimIdGenerator protocol + SequentialClaimIdGenerator
├── services/s3_service.py            # ClaimDocumentStorage protocol + S3ClaimDocumentStorage (boto3), object keys
├── dependencies.py                   # get_claim_service(), get_claim_document_storage()
├── config.py                         # Settings from environment variables
└── main.py                           # App, CORS middleware, routers
```

Routes depend on `get_claim_service` through FastAPI dependency injection. Tests override it with
`app.dependency_overrides` to get a fresh store for every test.

## Extending

- **PostgreSQL:** add a `PostgresClaimRepository` that implements `ClaimRepository` (`add`, `get`, `list`) and a
  sequence-backed `ClaimIdGenerator`, then return them from `get_claim_service()` in `app/dependencies.py`. Routes,
  schemas and the service do not change.
- **Textract / AI processing:** read the document from `s3_bucket`/`s3_object_key` on the claim.

## Amazon S3

- Bucket: `S3_BUCKET_NAME` (development: `healthcare-claims-ai-dev-2026`, `ap-south-1`). The bucket is private:
  all four Block Public Access settings are on, ACLs are disabled (BucketOwnerEnforced), there is no bucket policy,
  and SSE-S3 default encryption is enabled. The API never sets ACLs or makes objects public.
- Object key: `incoming/{claim_id}/{filename}`, content type `application/pdf`.
- Credentials: boto3's standard chain only, never code or `.env`. Locally that means an AWS CLI profile (`aws configure` /
  `aws login`, check with `aws sts get-caller-identity`); in AWS, an IAM role. The identity needs `s3:PutObject` on
  `arn:aws:s3:::<bucket>/incoming/*`.
- One boto3 client per process, with standard retries and 5 s connect / 60 s read timeouts. AWS errors are logged
  with their details by `app.services.s3_service` and returned to clients only as a generic 500.

## Configuration

Set these as environment variables, or for local development in `backend/claims-api/.env` (git-ignored; copy
`.env.example`). Real environment variables take precedence over `.env`.

| Variable | Default | Description |
| --- | --- | --- |
| `S3_BUCKET_NAME` | (none) | Bucket for claim documents. Without it, `POST /claims/upload` returns 503. |
| `AWS_REGION` | `ap-south-1` | Region of the bucket. |
| `CORS_ALLOW_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated browser origins allowed to call the API. Wildcards are not used. |
| `LOG_LEVEL` | `INFO` | Python logging level. |
| `APP_NAME`, `APP_VERSION`, `ENVIRONMENT` | `Healthcare Claims API`, `0.1.0`, `local` | Shown in the OpenAPI document and `/health` |

CORS allows only `GET` and `POST` with the `Content-Type` and `Authorization` headers.

## Running and testing

```bash
cd backend/claims-api
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt     # macOS/Linux: .venv/bin/python
copy .env.example .env                                         # then set S3_BUCKET_NAME
aws sts get-caller-identity                                    # confirms the AWS credentials boto3 will use
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
.venv\Scripts\python -m pytest -q
```

Quick manual checks (PowerShell):

```powershell
Invoke-RestMethod http://localhost:8000/claims
Invoke-RestMethod http://localhost:8000/claims -Method Post -ContentType application/json `
  -Body '{"patient_id":"PAT10001","provider_id":"PRV10001","payer_id":"PAY10001","claim_type":"OUTPATIENT","document_name":"claim_10001.pdf"}'
Invoke-RestMethod http://localhost:8000/claims/CLM10001
```
