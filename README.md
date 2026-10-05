# ORDO

ORDO is a group dining and ordering platform: a FastAPI backend and a Next.js frontend. The project is in early development; a leader creates a party, uploads a menu PDF, reviews and confirms the parsed menu and shares a link. Guests join with a name, choose their food and submit. The leader sees every order, the totals and one consolidated order for the restaurant.

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
ruff check . && ruff format --check .
```

## Frontend
```bash
cd frontend
npm install
cp .env.example .env.local     # API URL (default http://localhost:8000)
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test            # component tests (Vitest)
npm run build
```

### End-to-end tests
These run the real backend and frontend in Chrome (uses the Chrome installed on your machine):
```bash
createdb ordo_e2e                  # once
npx playwright test                # starts both servers on ports 8001 and 3001
```
