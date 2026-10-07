# Healthcare Claims AI — Frontend

Web console for an AI-assisted healthcare claims platform. Claims administrators use it to submit claims, watch a
multi-agent AI pipeline review each claim, inspect the evidence behind every decision, and monitor quality metrics.

**Claim upload** (`/upload`) talks to the real FastAPI claims API in `backend/claims-api`
(`POST /claims/upload` stores the PDF in Amazon S3; `GET /claims` lists claims). Every other screen still runs on realistic mock data served by an in-memory mock
API, so those pages work without a backend, AWS, AgentCore or MCP servers.

## Features

| Page | Route | What it shows |
| --- | --- | --- |
| Dashboard | `/dashboard` | Claim metrics, recent claims, status breakdown, 7-day trend |
| Claims | `/claims` | Searchable, filterable, paginated claims list with View / Process actions |
| Claim Details | `/claims/:claimId` | Summary plus tabs: Overview, AI Processing, RAG Evidence, Enterprise Systems, Fraud Analysis, Audit Trail |
| Submit New Claim | `/upload` | Uploads the claim PDF with FastAPI `POST /claims/upload` (stored in S3) and lists claims from `GET /claims` |
| Analytics | `/analytics` | Status, trend, agent timing, fraud risk and payer charts |
| AI Processing | `/ai-processing` | Agent performance and the live pipeline for any claim |
| Evaluation | `/evaluation` | RAG / decision quality metrics, test cases, simulated evaluation runs |
| Settings | `/settings` | Read-only application, AI, RAG and integration configuration |

`/` redirects to `/dashboard`; unknown routes show a "Page not found" screen.

## Tech stack

- React 19, TypeScript (strict), Vite 7
- Tailwind CSS 4 with shadcn/ui-style components built on Radix UI primitives
- React Router 7, Axios, Lucide icons, Recharts 3, Sonner toasts
- Vitest, Testing Library and jsdom for tests

## Getting started

Requires Node.js 20.19+ (or 22.12+) and npm.

```bash
cd frontend/react-app
npm install
cp .env.example .env   # optional, defaults are fine
npm run dev            # http://localhost:5173
```

The **Submit New Claim** page needs the claims API running on port 8000 (other pages do not):

```bash
cd backend/claims-api
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python
copy .env.example .env                                   # set S3_BUCKET_NAME; AWS credentials come from your AWS CLI profile
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

The API allows browser calls from `http://localhost:5173` (CORS, see `CORS_ALLOW_ORIGINS`). API reference:
[`docs/api/claims-api.md`](../../docs/api/claims-api.md); Swagger UI: http://localhost:8000/docs.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run typecheck` | Type-check the project (`tsc -b`) |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally (http://localhost:4173) |
| `npm test` | Run the test suite once |

### Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_USE_MOCK_API` | `true` | Use the in-memory mock API for every page except claim creation. Only claim creation is backed by FastAPI so far, so `false` logs a warning and still uses mocks for the other pages. |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the FastAPI claims API. |

## Project structure

```text
src/
├── components/
│   ├── ui/            # Design-system primitives (button, card, badge, tabs, dialog, table, ...)
│   ├── common/        # PageHeader, DataTable, MetricCard, Loading/Error/Empty states, Pagination, ...
│   ├── layout/        # Sidebar, TopNavbar, GlobalSearch (Ctrl+K)
│   ├── claims/        # Claim table, filters, status/risk badges, summary cards, overview, audit trail
│   ├── agents/        # Pipeline timeline, agent cards and per-agent result details, decision card
│   ├── fraud/         # Fraud score gauge, checks, history
│   ├── rag/           # RAG evidence cards and source viewer
│   ├── integrations/  # EHR / Payer / Provider / Coding system panels and API call logs
│   ├── charts/        # Recharts wrappers (donut, bar charts, theme)
│   ├── dashboard/     # Dashboard-specific charts and tables
│   ├── evaluation/    # Metric cards and test case table
│   └── upload/        # Create claim form and PDF dropzone
├── data/              # Mock data: patients, providers, payers/policies, claims, agent rules, RAG, evaluation
├── hooks/             # useAsync, useClaimProcessing, useMediaQuery, useDebouncedValue, useDocumentTitle
├── layouts/           # AppLayout (sidebar, top bar, responsive drawer)
├── lib/               # cn() helper and app configuration
├── pages/             # One component per route
├── routes/            # Route table and navigation metadata
├── services/          # claimsApi (real FastAPI calls), ClaimsService abstraction, mock implementation, Axios client
├── test/              # Test setup, fake claims API adapter (mockApi.ts) and app-level tests
├── types/             # Domain types (claims, agents, RAG, ...) and claim API DTOs (claimApi.ts)
└── utils/             # Formatting, dates, status metadata, claim filtering
```

## Architecture

```text
pages/components ──> hooks (useAsync, useClaimProcessing) ──> services/claimsService.ts
                                                                        │
                                                    ┌───────────────────┴───────────────────┐
                                        claimsService (ClaimsService)               claimsApi (create/list/get)
                                        services/mockClaimService.ts               services/apiClient.ts (Axios)
                                        in-memory store + src/data                 ──> FastAPI /claims
```

- **`claimsApi`** sends real HTTP requests through the shared Axios instance. The client's response interceptor
  turns every failure into an `ApiError` with a user-friendly message: network errors, timeouts, 400, 404 and 500
  (server details are never shown). For 422 responses it also returns per-field messages (`fieldErrors`), which the
  create form shows next to the matching inputs.

- **UI depends only on the `ClaimsService` interface** (`src/services/claimsService.ts`). Pages never import
  mock data directly.
- **`mockClaimService`** keeps claims in memory, adds realistic latency, and simulates the agent pipeline step by
  step. Processing updates are pushed to subscribers (`subscribeToProcessing`), so progress survives navigating
  away from a claim and back.
- **Decisions are rule-based**, derived from the mock data rather than hard-coded per screen:
  inactive eligibility → Denied; excluded procedure → Denied; high fraud score → Fraud Review;
  missing document fields or missing prior authorization → Request Information; otherwise Approved.
- Every page has loading, empty and error states (with Retry), and filters and tabs are kept in the URL so views
  can be bookmarked and shared.

## Mock data

| Claim | Patient | Scenario | Outcome |
| --- | --- | --- | --- |
| CLM10001 | John Smith | Pneumonia admission (J18.9 / 99223), active policy POL1001 | Approved |
| CLM10002 | Sarah Jones | Policy POL1002 inactive since 30 Jun 2026 | Denied |
| CLM10003 | Michael Brown | Cosmetic procedure 15788 excluded by POL1003 | Denied |
| CLM10004 | Priya Shah | Knee replacement 27447 needs prior authorization (POL1004), none on file | Request Information |
| CLM10005 | David Wilson | Cholecystectomy 47562 needs prior authorization, none on file | Request Information |
| CLM10006 | Emily Davis | Claim document missing required fields | Request Information |
| CLM10007 | John Smith | Duplicate of CLM09001 (fraud score 0.94) | Fraud Review |
| CLM10008 | Robert Miller | Unusual provider billing pattern (fraud score 0.81) | Fraud Review |
| CLM10011–12 | Various | New submissions | Pending (process them from the UI) |

Claims uploaded on the upload page live in the FastAPI service and S3, not in this mock data. The API numbers its claims
from CLM10001 too, so the same ID can refer to different claims in the two stores until the other pages move to
the API. The mock data also covers 8 patients, 3 providers, 2 payers with 8 policies, RAG policy evidence, enterprise system API
call logs, analytics series and 11 evaluation test cases. Mock data resets on page reload.

## Try it

1. **Dashboard** → click a metric card (for example *Fraud Review*) to open the filtered claims list.
2. **Claims** → search "Priya" or filter by status / payer / provider / risk / date; click a row to open details.
3. Click **Process** on CLM10011 → the AI Processing tab runs all seven pipeline steps live.
4. Open **CLM10007** → Fraud Analysis shows the 0.94 score and the duplicate match with CLM09001.
5. **Submit New Claim** (backend running) → enter `PAT10001`, `PRV10001`, `PAY10001`, *Outpatient*, choose a PDF
   and click *Upload Claim*. The API returns `CLM10001` with status `UPLOADED` and the S3 object
   `incoming/CLM10001/<file>.pdf`; *Upload Another Claim* produces `CLM10002`. Invalid IDs show field-level errors,
   non-PDF files show "Only PDF files are supported.", and S3 failures show "Unable to upload claim document.
   Please try again."
6. **Evaluation** → *Run Evaluation* replays the test suite with progress and a completion toast.

## Moving the remaining pages to FastAPI (future)

Claim creation already uses `claimsApi`. To move the rest:

1. Create `src/services/apiClaimService.ts` that implements `ClaimsService` on top of `claimsApi` and the shared
   Axios instance, adding endpoints as the backend grows (for example `POST /claims/{id}/process`,
   `GET /claims/{id}/agents`, `GET /claims/{id}/rag-evidence`, `GET /enterprise/status`).
2. Return the same TypeScript types from `src/types` (or map backend DTOs to them inside the service).
3. Replace `subscribeToProcessing` with polling or server-sent events from the backend.
4. In `createClaimsService()` (`src/services/claimsService.ts`), return the API implementation when
   `VITE_USE_MOCK_API=false`, and set `VITE_API_BASE_URL` to the backend URL.

No page or component changes are needed: they only use the `ClaimsService` interface.

## Accessibility and responsiveness

- Semantic landmarks, skip link, labelled controls, keyboard-operable table rows, visible focus outlines, and
  `aria-live` progress updates. Animations respect `prefers-reduced-motion`.
- Desktop (≥ 1024px): full sidebar that can collapse to an icon rail. Tablet: icon rail plus drawer.
  Mobile: drawer navigation, stacked cards and horizontally scrollable tables with pinned action columns.
