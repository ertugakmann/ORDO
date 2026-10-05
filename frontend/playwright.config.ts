import { defineConfig } from "@playwright/test";

// End-to-end tests run the real backend (against its own "ordo_e2e" database)
// and the real frontend. Create the database once with: createdb ordo_e2e
const API_PORT = 8001;
const WEB_PORT = 3001;
const DATABASE_URL = "postgresql+psycopg://localhost/ordo_e2e";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    // Uses the Chrome installed on this machine, so no browser download is needed.
    channel: "chrome",
  },
  webServer: [
    {
      command: `.venv/bin/alembic downgrade base && .venv/bin/alembic upgrade head && .venv/bin/uvicorn app.main:app --port ${API_PORT}`,
      cwd: "../backend",
      url: `http://localhost:${API_PORT}/health`,
      env: {
        DATABASE_URL,
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
      },
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -- -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
    },
  ],
});
