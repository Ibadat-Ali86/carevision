# 🏥 CareVision: Multimodal AI Diagnostic Assistant

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NVIDIA NIM](https://img.shields.io/badge/AI-NVIDIA_NIM-76B900?logo=nvidia&logoColor=white)](https://build.nvidia.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> **CareVision** is an enterprise-grade Progressive Web Application (PWA) that empowers Community Health Workers (CHWs) and clinicians with AI-assisted diagnostic capabilities in resource-constrained environments. Powered by NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`), it delivers real-time multimodal analysis of medical documents, diagnostic test strips, and medical scans — all with multilingual support and stateless JWT authentication.

---

## 📋 Table of Contents

1. [Key Features](#-key-features)
2. [System Architecture](#️-system-architecture)
3. [Repository Structure](#-repository-structure)
4. [Quick Start](#-quick-start)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
5. [Environment Variables Reference](#-environment-variables-reference)
6. [API Reference](#-api-reference)
7. [Security Model](#-security-model)
8. [Internationalization (i18n)](#-internationalization-i18n)
9. [PWA Capabilities](#-pwa-capabilities)
10. [Contributing](#-contributing)
11. [License](#-license)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **Multimodal AI (DocReader)** | Extracts and interprets clinical information from medical documents and reports using vision-language AI |
| 🔬 **Test Strip Analysis** | Automated interpretation of diagnostic test strips (malaria RDTs, pregnancy tests, urine dipsticks) |
| 🫀 **MedScan** | Context-aware analysis of medical imaging such as X-rays, ultrasounds, and fundus photographs |
| 💬 **Protocol Assistant** | Conversational AI retaining context from prior diagnostic images for follow-up clinical queries |
| 🔐 **Enterprise JWT Security** | Stateless authentication with short-lived access tokens, Argon2id password hashing, and device registration |
| 🌍 **Full i18n Support** | Multi-language UI and AI prompt synchronization across supported locales |
| 📱 **Progressive Web App** | Installable on mobile and desktop; Workbox-powered offline caching via `vite-plugin-pwa` |
| 📊 **Audit Logging** | Structured event logging with `logfire` for all clinical operations |

---

## 🏗️ System Architecture

CareVision is a decoupled full-stack system with strict layer boundaries:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                │
│   React 18 + Vite 5 + TypeScript 5.2                                │
│   State: Zustand 4.5 (persisted)  │  Routing: React Router 6       │
│   UI: Radix UI + TailwindCSS 3.4  │  Forms: React Hook Form + Zod  │
│   HTTP: Axios 1.6 (JWT interceptor)│  PWA: vite-plugin-pwa 0.19    │
│   i18n: i18next 23  │  Offline DB: Dexie (IndexedDB)               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS / REST JSON
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API Layer                                   │
│   FastAPI 0.111  │  Python 3.13  │  Uvicorn (ASGI)                 │
│   Auth: PyJWT 2.8 (RS256 / HS256) + Argon2id (argon2-cffi 23.1)   │
│   Validation: Pydantic 2.9  │  Rate Limiting  │  CORS               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ OpenAI-compatible REST
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          AI Inference Layer                          │
│   NVIDIA NIM — meta/llama-3.2-11b-vision-instruct                  │
│   Endpoint: api.endpoints.nvidia.com (OpenAI SDK compatible)        │
│   Capabilities: image + text input → structured clinical JSON       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ asyncpg (connection pool)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Data Layer                                  │
│   PostgreSQL (Neon serverless) — production                         │
│   SQLite (aiosqlite) — local development                            │
│   Migrations: Alembic 1.13  │  ORM: SQLAlchemy 2.0.36 (async)      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```text
carevision_project/
│
├── 📁 carevision/
│   │
│   ├── 📁 backend/                    # FastAPI application root
│   │   ├── 📁 app/
│   │   │   ├── 📁 api/                # Route handlers: auth, analysis, logging
│   │   │   ├── 📁 core/               # Config, JWT utilities, security middleware
│   │   │   ├── 📁 db/                 # SQLAlchemy models, asyncpg session factory
│   │   │   ├── 📁 schemas/            # Pydantic request/response schemas
│   │   │   └── 📁 services/           # NVIDIA NIM client, prompt templates
│   │   ├── requirements.txt           # Pinned production dependencies
│   │   └── .env.example               # Safe template — copy to .env (NOT committed)
│   │
│   └── 📁 frontend/                   # React + Vite application
│       ├── 📁 src/
│       │   ├── 📁 api/                # Axios client with JWT Bearer interceptor
│       │   ├── 📁 components/         # Reusable UI components (Radix + Tailwind)
│       │   ├── 📁 locales/            # i18n translation JSON files per locale
│       │   ├── 📁 pages/              # Route-level views (Dashboard, Login, Analysis)
│       │   └── 📁 store/              # Zustand stores (auth, settings, offline queue)
│       ├── vite.config.ts             # Vite config: PWA, path aliases, proxy
│       └── package.json               # Pinned frontend dependencies
│
├── 📁 test_images/                    # Non-PII validation assets for AI testing
├── .gitignore                         # Excludes all secrets, artifacts, PII
├── README.md                          # This file
└── LICENSE                            # MIT License
```

---

## 🚀 Quick Start

### Prerequisites

| Dependency | Minimum Version | Notes |
|---|---|---|
| Python | 3.13 | Required for asyncpg 0.30 wheels |
| Node.js | 18.x LTS | For native `fetch`; 20.x recommended |
| npm | 9.x | Bundled with Node.js 18+ |
| Git | Any | For cloning |
| NVIDIA NIM API Key | — | [Get a free key](https://build.nvidia.com/) |
| PostgreSQL | — | **Production:** Neon serverless; **Dev:** SQLite (auto-configured) |

---

### Backend Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd carevision_project

# 2. Create and activate a virtual environment
cd carevision/backend
python3.13 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate

# 3. Install pinned dependencies
#    Note: asyncpg 0.30+ and pydantic-core require a C compiler (gcc/clang).
#    On Ubuntu/Debian: sudo apt install build-essential python3-dev
pip install -r requirements.txt

# 4. Configure secrets (never commit the .env file)
cp .env.example .env
# Edit .env and set:
#   GEMMA_API_KEY    → your NVIDIA NIM API key
#   SECRET_KEY       → run: python -c "import secrets; print(secrets.token_hex(32))"
#   DATABASE_URL     → postgresql+asyncpg://... (or leave SQLite default for dev)

# 5. Apply database migrations
alembic upgrade head

# 6. Start the development server
uvicorn app.main:app --reload
# API available at: http://localhost:8000
# Swagger UI:       http://localhost:8000/docs
```

---

### Frontend Setup

```bash
# From the repo root
cd carevision/frontend

# 1. Install dependencies
npm install

# 2. Configure the API URL
cp .env.example .env.local          # If no .env.example exists, create .env.local manually
# Set VITE_API_URL=http://localhost:8000

# 3. Start the development server
npm run dev
# Application available at: http://localhost:5173
```

> **Note:** The frontend runs a Vite dev server on port `5173`. The backend must be running on port `8000` for API calls to succeed. CORS is pre-configured to allow `localhost:5173`.

---

## 🔑 Environment Variables Reference

All secrets are loaded from `carevision/backend/.env` (never committed — see `.gitignore`).

**Generate values for the following before deploying:**

| Variable | Required | Description | How to Generate |
|---|---|---|---|
| `GEMMA_API_KEY` | ✅ Yes | NVIDIA NIM API key for LLM inference | [build.nvidia.com](https://build.nvidia.com/) |
| `SECRET_KEY` | ✅ Yes | JWT signing secret (256-bit minimum) | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | ✅ Yes | Async PostgreSQL DSN (or SQLite for dev) | `postgresql+asyncpg://user:pass@host/dbname` |
| `GEMMA_MODEL` | No | Override the NIM model slug | Default: `meta/llama-3.2-11b-vision-instruct` |
| `ALLOWED_ORIGINS` | No | JSON array of allowed CORS origins | `["https://yourdomain.com"]` |
| `R2_ACCOUNT_ID` | No | Cloudflare R2 account ID for image storage | Cloudflare dashboard |
| `R2_ACCESS_KEY` | No | R2 access key ID | Cloudflare dashboard |
| `R2_SECRET_KEY` | No | R2 secret key | Cloudflare dashboard |
| `R2_BUCKET` | No | R2 bucket name | — |
| `LOGFIRE_TOKEN` | No | Pydantic Logfire observability token | [logfire.pydantic.dev](https://logfire.pydantic.dev/) |
| `ENVIRONMENT` | No | `development` or `production` | — |

Use `.env.example` as a safe template — it contains placeholder values only and is committed to the repository.

---

## 📡 API Reference

CareVision uses FastAPI's automatic OpenAPI generation. When the backend is running, visit:

- **Swagger UI:** [`http://localhost:8000/docs`](http://localhost:8000/docs)
- **ReDoc:** [`http://localhost:8000/redoc`](http://localhost:8000/redoc)

### Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `POST /api/auth/login`. Access tokens have a short TTL; re-authenticate on expiry.

### Core Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user (CHW or supervisor) |
| `POST` | `/api/auth/login` | ❌ | Authenticate and obtain JWT access token |
| `POST` | `/api/analysis/docscan` | ✅ | Analyze a medical document image |
| `POST` | `/api/analysis/teststrip` | ✅ | Interpret a diagnostic test strip image |
| `POST` | `/api/analysis/medscan` | ✅ | Analyze a medical scan (X-ray, ultrasound, etc.) |
| `POST` | `/api/analysis/protocol` | ✅ | Query the protocol assistant with optional image context |
| `POST` | `/api/logs` | ✅ | Submit a clinical audit log entry |
| `GET` | `/api/health` | ❌ | Service health check |

---

## 🔐 Security Model

CareVision is designed for environments handling sensitive clinical data. The following security controls are enforced at the implementation level:

### Authentication & Authorization
- **Password hashing:** Argon2id (via `argon2-cffi 23.1`) — industry standard for healthcare applications; resistant to GPU brute-force attacks.
- **JWT tokens:** Signed with a 256-bit `SECRET_KEY`; short-lived access tokens prevent token reuse after expiry.
- **Device registration:** API clients must complete a device registration handshake before accessing analysis endpoints.
- **RBAC:** Role-based access control enforced at the data layer, not just route guards.

### Input Security
- All request bodies validated via Pydantic 2.9 schemas at the API boundary.
- Image payloads validated by content (not extension); base64-decoded and inspected before forwarding to inference.
- SQL queries fully parameterized via SQLAlchemy ORM — no raw string interpolation.
- Password complexity enforced on registration: minimum 8 characters, requiring uppercase, lowercase, digit, and special character.

### Secrets Management
- All credentials managed via environment variables; **zero secrets in source code**.
- `.env` files explicitly excluded by `.gitignore` — see the checklist in [Section 7 of the publishing guide](./github_ds_publishing_guide.md).
- Production rotation strategy: regenerate `SECRET_KEY` and revoke all active sessions; rotate `GEMMA_API_KEY` via NVIDIA console.

### Transport Security
- TLS enforced in production (Neon PostgreSQL requires `sslmode=require`).
- CORS restricted to explicitly allowed origins via the `ALLOWED_ORIGINS` environment variable.
- Rate limiting enforced on auth endpoints to mitigate credential stuffing attacks.

---

## 🌍 Internationalization (i18n)

CareVision supports multiple languages via `i18next 23` + `react-i18next 14`:

- Translation files are located in `carevision/frontend/src/locales/<locale>/translation.json`.
- The active locale is persisted in Zustand and synchronized to NVIDIA NIM prompts — AI responses are generated in the user's selected language.
- Language detection follows browser preference on first load, with manual override available in Settings.

To add a new locale:
1. Create `src/locales/<locale-code>/translation.json` with all keys from `en/translation.json`.
2. Register the locale in the i18n initialization configuration.
3. Update AI prompt templates in `app/services/` to include the new language instruction.

---

## 📱 PWA Capabilities

CareVision is installable as a native-like application on Android, iOS, and desktop:

- **Service Worker:** Generated by `vite-plugin-pwa 0.19` + Workbox 7; caches static assets and API responses.
- **Offline Queue:** Zustand + Dexie (IndexedDB) store pending analysis requests for sync when connectivity is restored.
- **Manifest:** Configured with app icons, theme color, and `display: standalone` for a full-screen native experience.

To install: open the app in a supported browser → click "Add to Home Screen" / "Install App" from the browser menu.

---

## 🤝 Contributing

1. Fork the repository and create a feature branch from `main`.
2. Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for all commit messages:
   ```
   feat(ai): integrate new vision model endpoint
   fix(auth): correct token expiry calculation
   docs(readme): update installation prerequisites
   ```
3. Ensure `npm run build` completes without TypeScript or ESLint errors before opening a PR.
4. Add or update tests in `carevision/backend/` for any new API route or service function.
5. Open a Pull Request — describe the problem solved, not just the implementation.

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

<div align="center">

Built for frontline healthcare workers · Powered by NVIDIA NIM · Made with ❤️

</div>
