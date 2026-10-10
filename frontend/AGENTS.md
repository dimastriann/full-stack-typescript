# AGENTS.md — frontend

React SPA for ProjectFlow: React Router (framework/Vite mode), Apollo GraphQL, Vitest + Testing Library.

## Commands

```bash
npm run dev             # vite dev server
npm run build           # typecheck + production build
npm run format          # prettier write
npm run format:check    # prettier check
npm run lint            # eslint (auto-fix)
npm run test            # vitest watch
npm run test:coverage   # vitest + coverage
```

## Conventions

- Entry/routes in `src/` following the existing React Router file-routes layout; keep route modules colocated with their sections.
- GraphQL: Apollo Client with documents next to the components that own them; keep fragments scoped per workspace/project entities.
- Never write tenant-scoped URLs or state without deriving from the authenticated session context.
- Entitlement gating on the frontend is presentation-only; never fake authorization bypasses.

## Testing

- Vitest + Testing Library under colocated `*.test.tsx` files (or `test/` where the repo already does).
- Cover critical flows: login/auth forms, workspace creation, chat send/receive rendering, and any billing-facing UI that surfaces entitlement gates.
- Mock Apollo and environment services in tests; do not hit a live backend.

## Commits

- Atomic per logical change; conventional lowercase subject.
- Run `format:check`, `lint`, `test`, and `build` before requesting review.
