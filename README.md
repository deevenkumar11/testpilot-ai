# TestPilot AI — Intelligent API Testing & Automation Platform

![TestPilot AI Banner](https://img.shields.io/badge/TestPilot_AI-v1.0.0-indigo?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.13-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

TestPilot AI is a functional, portfolio-ready API testing, test automation, and intelligent diagnostic platform designed for modern engineering teams. It allows developers to send HTTP requests, inspect responses, configure automated assertions, track execution history, and receive instant AI-assisted troubleshooting explanations when requests or assertions fail.

---

## 🌟 Key Features

### 1. 📊 Real-Time Analytics Dashboard
- Live KPIs: Total Executions, Success Rate (%), Failed Requests, and Average Response Time (ms).
- Interactive Recharts Visualizations: Outcome Breakdown (Donut Chart) and Latency Trend Over Time.
- Real SQLite database-driven analytics—no hardcoded metrics.
- Live Recent Executions feed with one-click full inspection drawers.

### 2. 🚀 Interactive API Request Builder
- Full HTTP Method Support: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Key-Value editors for query parameters and request headers with quick presets (`Authorization: Bearer`, `Content-Type: application/json`, etc.).
- Monospace JSON Request Body editor with built-in prettify/format and syntax validation.
- Real-time response inspection: formatted JSON/text, response headers, latency, size, and status code badges.
- One-click "Save as Test Case" directly from the builder.

### 3. 🧪 Automated Test Suites & Assertion Engine
- Create, manage, and persist automated test cases in SQLite.
- Multi-assertion support:
  - **Status Code**: Equals, not equals, less than, greater than.
  - **Response Time**: Threshold assertions (e.g. `< 1500ms`).
  - **JSON Field Existence**: Nested dot-notation check (e.g. `data.user.id`).
  - **JSON Field Value**: Value matching, contains, and type coercion.
  - **Body Contains**: Substring validation on raw body payload.
- Execute single tests or trigger batch suite execution with the interactive Batch Test Runner.

### 4. 🧠 Modular AI Error Diagnostics
- Automatically analyzes failed HTTP requests (4xx, 5xx), timeouts, connection failures, and assertion mismatches.
- **Two-Tier Diagnostic Engine**:
  1. **Built-in Rule-Based Engine**: Completely local, deterministic, zero-cost, instant expert diagnostics—works offline without an API key!
  2. **Optional LLM Integration**: Connect Google Gemini or OpenAI via environment variables or runtime settings.
- Distinct outputs:
  - **Summary**: Concise explanation of what went wrong.
  - **Confirmed Facts**: Strictly observable data (status code, latency, headers).
  - **Possible Causes**: Prioritized hypotheses for the root cause.
  - **Suggested Fixes**: Numbered, step-by-step developer troubleshooting actions.

### 5. 📜 Execution History & Audit Logs
- Automatically persists all executed requests with timestamps, outcome, latency, payload, headers, and AI analysis.
- Filter by HTTP Method (`GET`, `POST`, etc.) and Outcome (`PASS`, `FAIL`, `ERROR`).
- Search by endpoint URL or test case name.
- Safe "Clear History" button with confirmation modal.

### 6. 🛡️ Security & SSRF Defense (Server-Side Request Forgery)
- **SSRF Guard**: Prohibits requests to localhost, loopback (`127.0.0.1`, `::1`), private networks (RFC 1918 `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud metadata (`169.254.169.254`, `metadata.google.internal`).
- **DNS Resolution & Recheck**: Resolves domain names and validates every resolved IP address before connection.
- **Redirect Inspection**: Inspects and revalidates every HTTP redirect hop.
- **Resource Limits**: Strict timeout bounds (max 30s) and payload size limit (5MB request, 10MB response).
- **Safe Error Handling**: Prevents server stack traces or internal secrets from leaking to the frontend.

---

## 🏛️ Architecture & Directory Structure

```
testpilot-ai/
├── backend/
│   ├── app/
│   │   ├── api/                 # REST Route Handlers
│   │   │   ├── health.py        # System health & status
│   │   │   ├── dashboard.py     # Aggregated analytics
│   │   │   ├── requests.py      # HTTP execution & assertions
│   │   │   ├── test_cases.py    # Test case CRUD & suite runner
│   │   │   ├── history.py       # Execution history & audit logs
│   │   │   ├── ai.py            # On-demand AI diagnostics
│   │   │   ├── settings.py      # Security & runtime configuration
│   │   │   └── mock_api.py      # Built-in mock endpoints for immediate testing
│   │   ├── core/                # Core configurations
│   │   │   ├── config.py        # Environment & pydantic settings
│   │   │   ├── database.py      # SQLAlchemy engine & session factory
│   │   │   └── security.py      # SSRF validation & IP range checks
│   │   ├── models/              # SQLAlchemy Database Models
│   │   │   ├── test_case.py     # TestCase table definition
│   │   │   └── history.py       # ExecutionHistory table definition
│   │   ├── schemas/             # Pydantic Schemas & Data Contracts
│   │   │   ├── requests.py      # Execution & Assertion models
│   │   │   ├── test_case.py     # TestCase schemas
│   │   │   ├── history.py       # History schemas
│   │   │   ├── dashboard.py     # Dashboard stats schemas
│   │   │   ├── ai.py            # AI diagnostics schemas
│   │   │   └── settings.py      # Settings schemas
│   │   ├── services/            # Business Logic Services
│   │   │   ├── http_client.py   # SSRF-safe HTTPX client
│   │   │   ├── assertion_evaluator.py # Multi-rule assertion evaluator
│   │   │   ├── ai_service.py    # Modular diagnostic engine (Rule-based + LLM)
│   │   │   └── dashboard_service.py # Database KPI aggregator
│   │   ├── tests/               # Automated Pytest Suite
│   │   │   ├── conftest.py      # In-memory test database & TestClient fixtures
│   │   │   ├── test_ssrf.py     # SSRF defense verification
│   │   │   ├── test_assertions.py # Assertion logic tests
│   │   │   ├── test_api_endpoints.py # Integration tests for REST endpoints
│   │   │   └── test_ai_service.py # AI explanation logic tests
│   │   └── main.py              # Application factory, CORS, and seed data
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client API wrapper
│   │   │   └── client.js
│   │   ├── components/
│   │   │   ├── common/          # Badges, Buttons, Cards, Modals, Toasts
│   │   │   ├── layout/          # Sidebar, Navbar
│   │   │   ├── request/         # RequestBuilder, KeyValueEditor, JsonEditor, AssertionEditor, ResponseViewer, AiExplanationCard
│   │   │   ├── history/         # HistoryTable, ExecutionDrawer
│   │   │   └── testcase/        # TestCaseModal, BatchRunnerModal
│   │   ├── pages/               # Dashboard, RequestBuilderPage, TestSuitesPage, HistoryPage, SettingsPage
│   │   ├── App.jsx              # Main router & toast provider
│   │   ├── main.jsx             # React DOM root
│   │   └── index.css            # Tailwind & dark theme styling
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── README.md
└── .gitignore
```

---

## 🛠️ Prerequisites & Installation

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ (Tested on Node.js v22.18)
- npm or yarn

### 1. Backend Setup

```bash
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
```

### 2. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

---

## 🚀 Running the Application

### Start the Backend Server
From the `backend` folder (or workspace root with `python -m uvicorn app.main:app`):
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start at `http://127.0.0.1:8000`.
- Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`
- Redoc API Documentation: `http://127.0.0.1:8000/redoc`

### Start the Frontend Dev Server
From the `frontend` folder:
```bash
cd frontend
npm run dev
```
The Vite development server will start at `http://localhost:5173`. Open your browser and navigate to this URL.

---

## ⚙️ Environment Variables

Configure backend settings via `backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./testpilot.db` | SQLAlchemy SQLite database URL |
| `SSRF_PROTECTION_ENABLED` | `true` | Enforces loopback, RFC1918, and metadata protection |
| `DEFAULT_TIMEOUT_SECONDS` | `10.0` | Default timeout for outgoing HTTP requests |
| `MAX_TIMEOUT_SECONDS` | `30.0` | Hard cap on user-defined request timeouts |
| `MAX_REQUEST_SIZE_BYTES` | `5242880` | 5 MB max request body payload |
| `MAX_RESPONSE_SIZE_BYTES` | `10485760` | 10 MB max response body size |
| `AI_PROVIDER` | `rule_based` | `rule_based` (default), `gemini`, or `openai` |
| `GEMINI_API_KEY` | `""` | Optional Google Gemini API key |
| `OPENAI_API_KEY` | `""` | Optional OpenAI API key |
| `AI_MODEL` | `""` | Optional model name (e.g. `gemini-1.5-flash`, `gpt-4o-mini`) |

---

## 📖 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and database connectivity check |
| `GET` | `/api/dashboard/stats` | Aggregated real-time metrics and charts data |
| `POST` | `/api/requests/execute` | Executes an HTTP request, evaluates assertions, logs history, and provides AI error diagnosis if failed |
| `GET` | `/api/test-cases` | List all saved automated test cases |
| `POST` | `/api/test-cases` | Create a new automated test case |
| `GET` | `/api/test-cases/{id}` | Retrieve a test case by ID |
| `PUT` | `/api/test-cases/{id}` | Update an existing test case |
| `DELETE` | `/api/test-cases/{id}` | Delete a test case |
| `POST` | `/api/test-cases/{id}/run` | Execute a test case and log results |
| `POST` | `/api/test-cases/run-all` | Batch run the entire test suite and generate a summary report |
| `GET` | `/api/history` | Filterable and paginated execution audit logs |
| `GET` | `/api/history/{id}` | Retrieve full details of a specific execution log |
| `DELETE` | `/api/history?confirm=true` | Clear all execution history records |
| `POST` | `/api/ai/analyze` | On-demand AI diagnostics for any arbitrary error |
| `GET` | `/api/settings` | Retrieve active safety configurations and AI status |
| `PUT` | `/api/settings` | Update runtime settings and API keys safely |
| `GET` | `/api/mock-api/users` | Demo mock users endpoint |
| `GET` | `/api/mock-api/delay/{sec}` | Simulates latency for testing timeouts |
| `GET` | `/api/mock-api/status/{code}` | Simulates HTTP status codes (400, 401, 404, 500, etc.) |
| `GET` | `/api/mock-api/auth-test` | Validates Bearer authorization header |

---

## 🧪 Automated Testing

Backend tests are implemented with `pytest` and `httpx.AsyncClient` test harness.

Execute all unit and integration tests:
```bash
python -m pytest backend/app/tests -v
```

Test coverage includes:
- SSRF prevention (blocking `127.0.0.1`, `localhost`, `169.254.169.254`, `10.x`, `192.168.x`, `file://` scheme)
- Assertion evaluator logic (status codes, latency thresholds, JSON paths, body substrings)
- Full REST CRUD for test cases and execution history
- Rule-based AI diagnostics for 400, 401, 404, 500, timeouts, and assertion failures
- System health checks and mock endpoints

---

## 🔒 Security & Ethical Guidelines

> **Ethical API Testing Disclaimer:** TestPilot AI is intended solely for testing APIs that you own, operate, or have explicit written authorization to test. Do not direct requests at third-party services without permission.

- **Stack Traces**: Internal backend exceptions are intercepted by a global exception handler and replaced with clean, sanitized JSON error responses to prevent leaking server file paths or secrets.
- **SSRF Hardening**: Pre-validates destination schemes and hostnames, resolves DNS to verify IP addresses against restricted network ranges, and re-validates each redirect hop.
- **Secret Masking**: API keys are never echoed back in plaintext or leaked in API responses.

---

## 🔮 Limitations & Future Improvements

- **Scheduled Test Runs**: Adding cron-based headless background executions with webhook notifications (Slack/Discord).
- **Environment Variables in Requests**: Supporting Postman-style `{{baseUrl}}` variable interpolation in URL, headers, and request bodies.
- **OpenAPI / Swagger Importer**: Ability to import OpenAPI v3 specs and auto-generate test suites.
