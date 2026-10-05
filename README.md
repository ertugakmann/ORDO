# ORDO

ORDO is a group dining and ordering platform: a FastAPI backend and a Next.js frontend. The project is in early development; so far the backend exposes `GET /health` and the frontend shows the API connection status.

## Prerequisites
- Python 3.12+ (developed on 3.14)
- Node.js 20+ and npm
- PostgreSQL (create two databases: `ordo` and `ordo_test`)

## Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env              # adjust DATABASE_URL if needed
alembic upgrade head              # create the tables
uvicorn app.main:app --reload   # http://127.0.0.1:8000/health
pytest
ruff check .
```

## Frontend
```bash
cd frontend
npm install
cp .env.example .env.local     # API URL (default http://localhost:8000)
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```
