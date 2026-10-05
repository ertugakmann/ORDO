# ORDO

Early-stage monorepo: a FastAPI backend and a Next.js frontend. No product features exist yet; the backend exposes only `GET /health` and the frontend is still the starter template.

## Prerequisites
- Python 3.12+ (developed on 3.14)
- Node.js 20+ and npm

## Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload   # http://127.0.0.1:8000/health
pytest
ruff check .
```

## Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```
