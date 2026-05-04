<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![NVIDIA NIM](https://img.shields.io/badge/AI-NVIDIA_NIM-76B900?logo=nvidia&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)
![Deployed on Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?logo=railway&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-green)
![Status](https://img.shields.io/badge/Status-Live_in_Production-brightgreen)

# 🏥 CareVision — Multimodal AI Clinical Decision-Support PWA

### 🚀 **[Live Demo → carevision-chw.vercel.app](https://carevision-chw.vercel.app/landing)**

> **CareVision** is an enterprise-grade Progressive Web Application (PWA) that empowers Community Health Workers (CHWs) and clinicians with AI-assisted diagnostic capabilities in resource-constrained environments. Powered by **NVIDIA NIM** (`meta/llama-3.2-11b-vision-instruct`), it delivers real-time multimodal analysis of medical documents, diagnostic test strips, medication scans, and wound assessments — with multilingual support, stateless JWT authentication, and a robust offline-first architecture.

</div>

---

## 📋 Table of Contents

1. [Live Demo](#-live-demo)
2. [Problem Statement](#-problem-statement)
3. [Key Features](#-key-features)
4. [System Architecture](#️-system-architecture)
5. [Deployment Stack](#-deployment-stack)
6. [Repository Structure](#-repository-structure)
7. [Quick Start](#-quick-start)
8. [Environment Variables](#-environment-variables-reference)
9. [API Reference](#-api-reference)
10. [Security Model](#-security-model)
11. [Internationalization](#-internationalization-i18n)
12. [PWA Capabilities](#-pwa-capabilities)
13. [Test Images](#-test-images)
14. [Contributing](#-contributing)
15. [License](#-license)

---

## 🌐 Live Demo

| Component | URL | Platform |
|---|---|---|
| **Frontend Application** | [carevision-chw.vercel.app](https://carevision-chw.vercel.app/landing) | Vercel |
| **Backend API (Swagger)** | `/docs` on the Railway service | Railway |
| **Health Check** | `GET /health` | Railway |

> **Try it now:** Register a free account at the live URL, then test all AI analysis features — TestStrip Reader, MedScan, Wound Assessment, Protocol Assistant, and DocReader — directly in your browser with real NVIDIA NIM inference.

---

## 📌 Problem Statement

Community health workers in last-mile clinics and remote geographies face complex clinical scenarios without immediate access to specialist medical advice. Existing digital health tools often rely on continuous, high-bandwidth internet — structurally absent in these regions.

**CareVision** bridges this critical gap by delivering a mobile-first, offline-capable clinical decision support system. By integrating the advanced multimodal capabilities of NVIDIA NIM with an intelligent offline-sync queue, CareVision allows CHWs to interpret diagnostic tests, identify medications, assess wounds, and consult WHO protocols seamlessly — ensuring patient care is never gated by network instability.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **Multimodal AI (DocReader)** | Extracts and interprets clinical information from medical documents and lab reports using vision-language AI |
| 🔬 **Test Strip Analysis** | Automated interpretation of rapid diagnostic tests (malaria RDTs, pregnancy tests, urine dipsticks) |
| 💊 **MedScan** | Context-aware analysis of medication packaging and labels — identifies drug name, dosage, indications, and contraindications |
| 🩹 **Wound Assessment** | Structured severity scoring (1–5 scale) with immediate referral recommendations for wound care |
| 🤖 **Protocol Assistant** | Conversational AI retaining context from prior diagnostic images for follow-up clinical queries |
| 🔐 **Enterprise JWT Security** | Stateless authentication with short-lived access tokens, Argon2id password hashing, and device registration |
| 🌍 **Full i18n Support** | Multi-language UI and AI prompt synchronization across 15+ supported locales |
| 📱 **Progressive Web App** | Installable on mobile and desktop; Workbox-powered offline caching via `vite-plugin-pwa` |
| 📊 **Audit Logging** | Structured event logging with `logfire` for all clinical operations |
| 🛡️ **Input Validation** | All payloads validated via Pydantic 2.9 at the API boundary; passwords enforced for complexity |

---

## 🏗️ System Architecture

CareVision is a decoupled full-stack system with strict layer boundaries:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                │
│   React 18 + Vite 5 + TypeScript 5.2                                │
│   State: Zustand 4.5 (persisted)   │  Routing: React Router 6      │
│   UI: Radix UI + TailwindCSS 3.4   │  i18n: i18next 23             │
│   HTTP: Axios 1.6 (JWT interceptor) │  PWA: vite-plugin-pwa 0.19   │
│   Offline DB: Dexie (IndexedDB)                                     │
│   Hosted: Vercel (CDN edge, SPA routing via vercel.json)            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS / REST JSON
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API Layer                                  │
│   FastAPI 0.111  │  Python 3.12  │  Uvicorn (ASGI)                 │
│   Auth: PyJWT (HS256) + Argon2id (argon2-cffi 23.1)                │
│   Validation: Pydantic 2.9  │  Rate Limiting  │  CORS              │
│   Hosted: Railway (Dockerized, auto-deploy from main branch)        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ OpenAI-compatible REST
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       AI Inference Layer                            │
│   NVIDIA NIM — meta/llama-3.2-11b-vision-instruct                  │
│   Endpoint: integrate.api.nvidia.com/v1 (OpenAI SDK compatible)     │
│   Capabilities: image + text input → structured clinical JSON       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ asyncpg (connection pool)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Data Layer                                 │
│   PostgreSQL (Neon serverless) — production                         │
│   SQLite (aiosqlite) — local development (auto-configured)          │
│   ORM: SQLAlchemy 2.0 (async)  │  Migrations: Alembic 1.13         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ☁️ Deployment Stack

CareVision is fully deployed and production-live using a modern, zero-infrastructure cloud stack:

| Layer | Platform | Details |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | Auto-deploys from `main` branch; SPA routing via `vercel.json` |
| **Backend** | [Railway](https://railway.app) | Dockerized FastAPI; auto-deploys from `main` branch |
| **Database** | [Neon](https://neon.tech) | Serverless PostgreSQL with SSL connection pooling |
| **AI Inference** | [NVIDIA NIM](https://build.nvidia.com) | `meta/llama-3.2-11b-vision-instruct` via OpenAI-compatible endpoint |

### Key Deployment Notes

- **Frontend env vars:** `VITE_API_BASE_URL` is baked at **build time** by Vercel. Any change requires a manual redeploy.
- **Backend env vars:** `GEMMA_API_KEY` (or `NVIDIA_API_KEY`) and `SECRET_KEY` must be set in Railway Variables. The backend accepts **either** key name for NVIDIA NIM authentication.
- **CORS:** The backend is pre-configured to accept requests from all `*.vercel.app` preview URLs via regex — no manual updates needed for preview deployments.
- **SPA routing:** `vercel.json` rewrites all non-asset paths to `index.html`, preventing 404 errors on direct navigation or page refresh.

---

## 📁 Repository Structure

```text
carevision/
│
├── 📁 backend/                         # FastAPI application root
│   ├── 📁 app/
│   │   ├── config.py                   # Pydantic settings (env var parsing + validation)
│   │   ├── main.py                     # FastAPI app factory, CORS, routers
│   │   ├── 📁 routes/                  # Route handlers: auth, analyze, protocols, log
│   │   ├── 📁 schemas/                 # Pydantic request/response schemas
│   │   ├── 📁 services/                # NVIDIA NIM client, image processor, storage
│   │   └── 📁 prompts/                 # Clinical system prompts per analysis type
│   ├── 📁 tests/                       # Pytest verification suite
│   ├── requirements.txt                # Pinned production dependencies
│   ├── .env.example                    # Safe placeholder template (copy → .env)
│   └── Dockerfile                      # Container build definition (Railway)
│
├── 📁 frontend/                        # React + Vite PWA
│   ├── 📁 src/
│   │   ├── 📁 api/                     # Axios client + endpoint functions
│   │   ├── 📁 components/              # Reusable UI components (Radix + Tailwind)
│   │   ├── 📁 constants/               # API base URL, timeout, feature flags
│   │   ├── 📁 features/                # Feature-level pages (TestStrip, MedScan, etc.)
│   │   ├── 📁 i18n/locales/            # i18n translation JSON files (15+ locales)
│   │   ├── 📁 pages/                   # Route-level views (Landing, Dashboard, Login)
│   │   └── 📁 store/                   # Zustand stores (auth, settings, offline queue)
│   ├── vite.config.ts                  # Vite config: PWA, path aliases, proxy
│   └── package.json                    # Pinned frontend dependencies
│
├── vercel.json                         # Vercel SPA rewrite rules
└── README.md                           # This file
```

---

## 🚀 Quick Start

### Prerequisites

| Dependency | Minimum Version | Notes |
|---|---|---|
| Python | **3.12** | Required for asyncpg wheels |
| Node.js | 18.x LTS | 20.x recommended |
| npm | 9.x | Bundled with Node.js 18+ |
| NVIDIA NIM API Key | — | [Get a free key →](https://build.nvidia.com/) |
| PostgreSQL | — | **Production:** Neon serverless; **Dev:** SQLite (auto-configured) |

---

### Backend Setup

```bash
# 1. Navigate to backend
cd carevision/backend

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate

# 3. Install pinned dependencies
pip install -r requirements.txt

# 4. Configure secrets — NEVER commit the .env file
cp .env.example .env
# Edit .env and set:
#   GEMMA_API_KEY  → your NVIDIA NIM API key (from build.nvidia.com)
#   SECRET_KEY     → python -c "import secrets; print(secrets.token_hex(32))"
#   DATABASE_URL   → postgresql+asyncpg://... (or leave SQLite default for dev)

# 5. Start the development server
uvicorn app.main:app --reload
# API available at:  http://localhost:8000
# Swagger UI:        http://localhost:8000/docs
```

---

### Frontend Setup

```bash
# From the repo root
cd carevision/frontend

# 1. Install dependencies
npm install

# 2. Configure the backend API URL
# Create .env.local and set:
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# 3. Start the development server
npm run dev
# Application at: http://localhost:5173
```

> **Note:** The frontend Vite dev server runs on port `5173`. The backend must be running on port `8000`. CORS is pre-configured to allow `localhost:5173`.

---

## 🔑 Environment Variables Reference

### Backend (`carevision/backend/.env`)

All secrets are loaded from `carevision/backend/.env` — **this file is never committed** (enforced by `.gitignore`). Use `.env.example` as a safe, placeholder-only template.

| Variable | Required | Description | How to Generate |
|---|---|---|---|
| `GEMMA_API_KEY` | ✅ Yes | NVIDIA NIM API key (also accepted as `NVIDIA_API_KEY`) | [build.nvidia.com](https://build.nvidia.com/) |
| `SECRET_KEY` | ✅ Yes | JWT signing secret (32+ chars minimum) | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | ✅ Yes | Async PostgreSQL DSN (or SQLite for dev) | `postgresql+asyncpg://user:pass@host/dbname` |
| `GEMMA_MODEL` | No | Override the NIM model slug | Default: `meta/llama-3.2-11b-vision-instruct` |
| `ALLOWED_ORIGINS` | No | JSON array of allowed CORS origins | `["https://yourdomain.com"]` |
| `R2_ACCOUNT_ID` | No | Cloudflare R2 account ID for image storage | Cloudflare dashboard |
| `R2_ACCESS_KEY` | No | R2 access key ID | Cloudflare dashboard |
| `R2_SECRET_KEY` | No | R2 secret key | Cloudflare dashboard |
| `LOGFIRE_TOKEN` | No | Pydantic Logfire observability token | [logfire.pydantic.dev](https://logfire.pydantic.dev/) |
| `ENVIRONMENT` | No | `development` or `production` | — |

### Frontend (`carevision/frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ Yes | Full URL of the backend API (e.g. `https://your-app.up.railway.app`) |

> **Vercel note:** `VITE_API_BASE_URL` must be set in **Vercel Project Settings → Environment Variables** and a redeploy triggered — it is baked into the production bundle at build time.

---

## 📡 API Reference

CareVision uses FastAPI's automatic OpenAPI generation. When the backend is running:

- **Swagger UI:** [`http://localhost:8000/docs`](http://localhost:8000/docs)
- **ReDoc:** [`http://localhost:8000/redoc`](http://localhost:8000/redoc)

### Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `POST /api/auth/token`. Access tokens have a short TTL — re-authenticate on expiry.

### Core Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user account |
| `POST` | `/api/auth/token` | ❌ | Authenticate and obtain JWT access + refresh token |
| `GET` | `/api/auth/me` | ✅ | Get the current authenticated user's profile |
| `POST` | `/api/auth/refresh` | ❌ | Refresh an expired access token |
| `POST` | `/analyze/teststrip` | ❌ | Interpret a rapid diagnostic test strip image |
| `POST` | `/analyze/medscan` | ❌ | Analyze medication packaging and labels |
| `POST` | `/analyze/woundassess` | ❌ | Assess wound severity and care recommendations |
| `POST` | `/analyze/docreader` | ❌ | Extract and summarize a clinical document |
| `POST` | `/protocols/` | ❌ | Query the Protocol Assistant (text + optional image) |
| `POST` | `/log/` | ✅ | Save a clinical encounter log entry |
| `GET` | `/log/{location_code}` | ✅ | Retrieve recent encounters for a location |
| `GET` | `/health` | ❌ | Service liveness check |

---

## 🔐 Security Model

CareVision is designed for environments handling sensitive clinical data. The following controls are enforced at the **implementation level**, not just configuration:

### Authentication & Authorization
- **Password hashing:** Argon2id (via `argon2-cffi`) — resistant to GPU brute-force attacks
- **JWT tokens:** HS256-signed with a 256-bit `SECRET_KEY`; short-lived access tokens with refresh rotation
- **Secret Key hardening:** The `SECRET_KEY` is automatically stripped of whitespace on startup to prevent silent JWT failures from PaaS environment variable editor quirks

### Input Security
- All request bodies validated via **Pydantic 2.9** schemas at the API boundary
- Image payloads validated by content (not extension); base64-decoded and compressed before forwarding
- SQL queries fully parameterized via SQLAlchemy ORM — no raw string interpolation
- Password complexity enforced on registration: min 8 chars, uppercase, lowercase, digit, and special character

### Secrets Management
- All credentials managed via environment variables — **zero secrets in source code**
- `.env` files explicitly excluded by `.gitignore`
- The backend accepts both `GEMMA_API_KEY` and `NVIDIA_API_KEY` and resolves them at startup with an explicit log entry confirming key loading

### Transport Security
- TLS enforced in production (Neon PostgreSQL requires `sslmode=require`)
- CORS restricted to explicitly allowed origins via `ALLOWED_ORIGINS`; regex-based wildcard support for Vercel preview deployments
- Rate limiting enforced on auth endpoints to mitigate credential stuffing

---

## 🌍 Internationalization (i18n)

CareVision supports 15+ languages via `i18next 23` + `react-i18next 14`:

- Translation files: `frontend/src/i18n/locales/<locale>/` (JSON format)
- Active locale is persisted in **Zustand** and synchronized to NVIDIA NIM prompts — AI responses are generated in the user's selected language
- Language detection follows browser preference on first load, with manual override in Settings

**Supported locales:** English, French, Spanish, Arabic, Hindi, Swahili, Amharic, Bengali, Indonesian, Vietnamese, Burmese, Khmer, Portuguese, Tagalog, Hausa

---

## 📱 PWA Capabilities

CareVision is installable as a native-like application on Android, iOS, and desktop:

- **Service Worker:** Generated by `vite-plugin-pwa` + Workbox; caches static assets
- **Offline Queue:** Zustand + Dexie (IndexedDB) stores pending analysis requests for auto-sync when connectivity is restored
- **Manifest:** Configured with app icons, theme color, and `display: standalone`

To install: open the app in a supported browser → click **"Add to Home Screen"** / **"Install App"** from the browser menu.

---

## 🖼️ Test Images

The `test_images/` directory contains **synthetic, non-PII validation assets** for testing all multimodal AI analysis features:

| File | Feature | Expected Result |
|---|---|---|
| `teststrip_malaria_POSITIVE.png` | TestStrip | Malaria RDT positive detection |
| `teststrip_covid19_NEGATIVE.png` | TestStrip | COVID-19 RDT negative detection |
| `medscan_amoxicillin_blister.png` | MedScan | Drug name and dosage extraction |
| `medscan_metformin_bottle.png` | MedScan | Drug name and dosage extraction |
| `docreader_cbc_lab_report.png` | DocReader | CBC lab report structured extraction |
| `docreader_patient_record.png` | DocReader | Patient record parsing |
| `woundassess_severity2_laceration.png` | WoundAssess | Severity 2 — laceration assessment |
| `woundassess_severity3_infected.png` | WoundAssess | Severity 3 — infected wound assessment |

> **Important:** These images contain no real patient data. All images are synthetic demonstration assets.

---

## 🤝 Contributing

1. Fork the repository and create a feature branch from `main`
2. Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   ```
   feat(ai): integrate new vision model endpoint
   fix(auth): correct token expiry calculation
   docs(readme): update system architecture diagrams
   ```
3. Ensure `npm run build` completes without TypeScript or ESLint errors
4. Add or update tests in `backend/tests/` for any new API route or service function
5. Open a Pull Request — describe the **problem solved**, not just the implementation

---

## 📜 License

This project is licensed under the **Apache 2.0 License**. See [LICENSE](./LICENSE) for details.

---

<div align="center">

🌐 **[Live Demo](https://carevision-chw.vercel.app/landing)** · Built for frontline healthcare workers · Powered by NVIDIA NIM · Made with ❤️

</div>