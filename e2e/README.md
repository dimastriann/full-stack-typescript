# E2E tests (opt-in)

Playwright suite covering user journeys against a running ProjectFlow stack.

## Prerequisites

- PostgreSQL and Redis: `docker compose up -d`
- Backend `.env` configured (see root `.env.example`)
- Optionally seeded users (`backend` demo seed), or provide credentials:

```
E2E_USER_EMAIL=admin@gmail.com
E2E_USER_PASSWORD=admin
```

## Run

```bash
cd e2e
npm install
npx playwright install chromium   # once
npm run test                      # against already-running services
E2E_AUTOSTART=1 npm run test      # let Playwright start backend + frontend
npm run show-report               # after failures (html report)
```

Scope of the current spec (`auth.spec.ts`): bad-credential rejection, seeded login landing on `/dashboard`, session persistence across reload, and logout return to `/login`.

Roadmap section: `ROADMAP.local.md` → "End-to-end tests".
