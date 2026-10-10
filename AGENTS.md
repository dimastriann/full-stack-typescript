# AGENTS.md — ProjectFlow (root)

Guidance for coding agents working anywhere in this repository.

## Project overview

- Full-stack TypeScript project-management app: NestJS + Apollo GraphQL backend, React Router (Vite) frontend.
- Open-source core ("ProjectFlow Core"). Commercial features live in a separate private repository (`project-flow-pro`) integrated only through the extension contracts in `contracts/` — never import private Pro code here.
- Local implementation checklist: `ROADMAP.local.md` (git-ignored). Update it after every completed feature or fix commit.

## Repository layout

- `backend/` — NestJS API (GraphQL, Prisma, Socket.IO, Redis)
- `frontend/` — React SPA (Vite, Apollo, React Router)
- `contracts/` — Core-owned extension/entitlement contracts consumed by Pro
- `docs/` — architecture, Core-Pro matrix, release checklists
- `scripts/` — bootstrap and smoke-test tooling
- `.github/` — CI workflows

## Working agreement

1. Implement and verify one section at a time; keep every commit atomic, including small fixes.
2. Run formatting, linting, tests, and builds appropriate to the section before handing off for review.
3. Wait for user review before committing.
4. Use short, specific commit messages without a co-author trailer.
5. Update `ROADMAP.local.md` immediately after every completed feature or fix commit.

## Environment

- Node.js: see `.nvmrc` (minimum `>=22.19.0`).
- Services: PostgreSQL and Redis (see `docker-compose.yml`).
- Config: copy `.env.example` where needed; never commit secrets or `.env` files.
- Backend Prisma client types must be generated (`npx prisma generate`) after schema edits; sync the checked-in GraphQL schema after contract-affecting changes.

## Verification commands

```bash
npm run format      # prettier (backend + frontend)
npm run lint        # eslint (backend + frontend)
npm run test        # backend jest + frontend vitest
npm run build       # backend + frontend builds
npm run smoke       # deployment smoke test
```

## Security rules (non-negotiable)

- Every tenant-aware query/mutation must enforce workspace membership and role boundaries; project-level permissions must not bypass workspace membership.
- Administrative endpoints are platform-admin-only; platform admins can never read client workspace content.
- No secrets, keys, or private Pro source in this repository. Frontend entitlement checks are presentation-only; enforcement belongs on the backend.

## Commit conventions

- Conventional, lowercase, short subject line (e.g. `fix: reject cross-workspace dashboard access`).
- One logical change per commit; split unrelated files into separate commits.

## Testing notes

- Backend: Jest unit tests per resolver/service; e2e config in `backend/test/`.
- Frontend: Vitest + Testing Library; cover critical forms and chat flows at minimum.
- CI runs install, format/lint checks, unit tests, builds, Prisma validation, dependency audit, and secret/dependency scanning; do not weaken gates without discussion.
