# Relay: Multi-Tenant AI Support Dispatcher

Relay is a production-ready, multi-tenant AI support system designed to automate ticket triage, prioritization, and resolution drafting. It uses advanced LLMs to provide deterministic, self-service support at scale.

## How to Run

### 1. Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Google Gemini API Key** (or OpenAI if configured GPT OSS configured through https://build.nvidia.com/openai/gpt-oss-120b)

### 🐳 Quick Start with Docker
If you have Docker installed, you can spin up the entire system with a single command:
```bash
docker-compose up --build
```
This will start:
- **Backend** at `http://localhost:8000`
- **Frontend** at `http://localhost:3000`

### 2. Manual Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create .env file with your GOOGLE_API_KEY
python main.py
```

The backend will run on `http://localhost:8000`.

### 3. Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## 🛠 Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Lucide Icons, React Force Graph.
- **Backend**: FastAPI (Asynchronous), SQLAlchemy, Pydantic.
- **Database**: SQLite (via aiosqlite for async performance).
- **Infrastructure**: Docker, Docker Compose (Containerized Microservices).
- **AI Engine**: Google Gemini 1.5 Flash.
- **Visualization**: GraphQL-style schema previews and Obsidian-style Graph View.


1. **Tenant Isolation**: Each request to the API must include a `tenant_id` to ensure strict data isolation.
2. **AI Reliability**: The system assumes the LLM can successfully map natural language to structured categories (Sales, Support, Technical) and priorities.
3. **Simulated CRM**: For this project, CRM profiles and NPS scores are simulated based on the customer's email domain and submission history.

## Simplified Components

- **Authentication**: JWT authentication is intentionally omitted for simplicity; tenant switching is handled via UI state.
- **Background Jobs**: AI triage is currently triggered on-demand during ticket creation for immediate feedback. In a high-volume system, this would move to a Celery/Redis queue.
- **Redis Cache**: The semantic caching layer is scaffolded but uses a local fallback if Redis is unavailable.

---
