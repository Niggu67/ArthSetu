# ArthSetu | अर्थसेतू

ArthSetu is an accessible financial guidance, government scheme discovery, and business assistance platform designed specifically for rural micro-entrepreneurs in India.

* **Backend**: Python 3.10+ / FastAPI / SQLAlchemy / SQLite (PostgreSQL ready)
* **Frontend**: Next.js 15 / React 19 / TypeScript / Tailwind CSS / Framer Motion / Lucide Icons
* **Frontend URL**: `http://localhost:3000`
* **Backend URL**: `http://localhost:8000`
* **API Documentation (Swagger)**: `http://localhost:8000/docs`

---

## Project Structure

```
ArthSetu/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint, CORS & routers
│   │   ├── config.py                # Pydantic Settings & environment variables
│   │   ├── database.py              # SQLAlchemy engine, session maker, Base
│   │   ├── models/                  # SQLAlchemy 2.0 ORM models (User, Scheme, Progress, Application, Notification)
│   │   ├── schemas/                 # Pydantic validation & response schemas (User, Scheme, Progress, Application, Notification, AI)
│   │   ├── api/                     # REST API routers (/api/auth, /users, /schemes, /eligibility, /ai, etc.)
│   │   ├── services/                # PBKDF2 hashing, JWT auth, eligibility engine & AI assistant (Gemini/OpenAI/Mock)
│   │   └── seeds/                   # Verified reference Indian government schemes seed loader
│   ├── tests/                       # Complete pytest suite (23 unit tests + Phase 2A, 2B, 3 E2E test suites)
│   ├── .env.example & .env
│   ├── requirements.txt
│   ├── pytest.ini
│   └── run.py                       # Local backend launcher
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout with AuthProvider & LanguageProvider
│   │   │   ├── globals.css          # Tailwind, accessible focus rings & custom palette
│   │   │   ├── page.tsx             # Root redirect (authenticated -> dashboard; guest -> login)
│   │   │   ├── login/page.tsx       # Phone/password login, language switcher, info modal
│   │   │   ├── register/page.tsx    # Name, phone, email, password validation
│   │   │   ├── onboarding/page.tsx  # 4-step wizard with Framer Motion slide transitions
│   │   │   ├── dashboard/page.tsx   # Live stats, rules-based recommendations, next learning spotlight & tracker summary
│   │   │   ├── schemes/page.tsx     # Full Schemes Explorer with live search, category pills & scheme cards
│   │   │   ├── schemes/[id]/page.tsx# Scheme Details with criteria, benefits, documents, external portal modal & actions
│   │   │   ├── eligibility/page.tsx # Interactive rules-based eligibility checker with real match scoring
│   │   │   ├── applications/page.tsx# Self-reported application tracker with Draft->Submitted->Under Review->Decision timeline
│   │   │   ├── learn/page.tsx       # 6 interactive financial literacy modules with persistent progress tracking
│   │   │   ├── ai/page.tsx          # ArthSetu AI Financial Assistant with grounded chat, starter prompts & action pills
│   │   │   └── profile/page.tsx     # Entrepreneur profile & enterprise details edit
│   │   ├── components/
│   │   │   ├── layout/              # AppShell, Header, Sidebar (desktop), BottomNav (mobile)
│   │   │   ├── ui/                  # Button, Input, Card, Badge, Modal
│   │   │   ├── auth/                # ProtectedRoute guard
│   │   │   └── dashboard/           # OverviewCard, ActionCard
│   │   ├── context/                 # AuthContext & LanguageContext (English, Hindi, Marathi)
│   │   ├── lib/api/                 # Centralized fetch client & typed API services (schemes, eligibility, applications, progress, ai)
│   │   └── types/                   # TypeScript interfaces matching backend models
│   ├── tailwind.config.ts           # Earthy greens, deep trust blues & warm canvas neutrals
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local                   # NEXT_PUBLIC_API_URL=http://localhost:8000
├── run.py                           # Root backend runner
└── README.md
```

---

## Getting Started

### 1. Start the FastAPI Backend

```powershell
# Windows
.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

# Linux / macOS
source .venv/bin/activate
PYTHONPATH=backend python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be available at:
- **API Base**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

### 2. Start the Next.js Frontend

```bash
cd frontend

# Development mode
npm run dev

# Or build & production start
npm run build
npm start
```

Frontend will be available at:
- **Web App**: `http://localhost:3000`

---

## Seed Data & Demo Account

The database includes 5 realistic reference government schemes verified against official ministry guidelines:
1. **Pradhan Mantri Mudra Yojana (PMMY)** - Loans up to ₹10 Lakhs (`https://www.mudra.org.in`)
2. **Prime Minister's Employment Generation Programme (PMEGP)** - Credit-linked subsidy up to 35% (`https://www.kviconline.gov.in/pmegpeportal/`)
3. **Stand-Up India Scheme** - ₹10 Lakhs to ₹1 Crore for SC/ST and Women entrepreneurs (`https://www.standupmitra.in`)
4. **PM Formalisation of Micro food processing Enterprises (PMFME)** - Subsidies for micro food processing units (`https://pmfme.mofpi.gov.in/`)
5. **Agri-Clinics and Agri-Business Centres (ACABC) Scheme** - Subsidized farm venture loans (`https://www.acabcmis.gov.in/`)

### Demo Entrepreneur Login Credentials
* **Mobile**: `9876543210`
* **Password**: `Devi@12345`

Or register any new account using your own 10-digit mobile number.

---

## Configuring the AI Assistant

The AI guidance assistant supports Google Gemini (default) and OpenAI via environment variables in `backend/.env`:

```ini
AI_PROVIDER="gemini"
GEMINI_API_KEY="your-gemini-api-key-here"
AI_MODEL="gemini-1.5-flash"
```

* Obtain a free Gemini API key at [Google AI Studio](https://aistudio.google.com/).
* If no key is set, the system safely returns an administrative configuration advisory without crashing.

---

## Running Automated Tests

### 1. Pytest Backend Suite (23 unit & functional tests)
```bash
.venv\Scripts\pytest backend\tests -v -k "not test_phase2a_e2e and not test_phase2b_e2e and not test_phase3_e2e"
```

### 2. End-to-End Live Integration Test Suites
Tests live servers on `http://127.0.0.1:8000` and `http://127.0.0.1:3000`:
```bash
# Phase 2A E2E: Auth, Onboarding & User Profile
.venv\Scripts\python backend\tests\test_phase2a_e2e.py

# Phase 2B E2E: Schemes, Eligibility Scoring, Application Tracker & Learning Progress
.venv\Scripts\python backend\tests\test_phase2b_e2e.py

# Phase 3 E2E: AI Guidance Assistant, Security, Contextual Actions & Advisory
.venv\Scripts\python backend\tests\test_phase3_e2e.py
```
