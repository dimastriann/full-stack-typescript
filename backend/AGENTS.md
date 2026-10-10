# AGENTS.md — backend

NestJS API for ProjectFlow: Apollo GraphQL, Prisma, Socket.IO, Redis.

## Commands

```bash
npm run build          # nest build
npm run start:dev      # watch mode
npm run format         # prettier write
npm run format:check   # prettier check
npm run lint           # eslint (auto-fix)
npm run test           # jest unit tests
npm run test:e2e       # jest e2e (test/ dir)
```

## Conventions

- Modules under `src/<domain>/`: `*.module.ts`, `*.service.ts`, resolvers for GraphQL, `dto/` for inputs.
- Services stay thin; put tenant/authorization checks in resolvers-and-services consistently — never trust client-supplied workspace/project scoping.
- Inject `PrismaService`; do not instantiate PrismaClient manually.
- After editing `prisma/schema.prisma`: run `npx prisma generate`, write a migration (`npx prisma migrate dev --name <change>`), and sync the checked-in GraphQL schema when contracts change.

## Security rules

- Every tenant-aware query/mutation verifies workspace membership and role boundaries; project-level permission must not bypass workspace membership.
- Platform admin (`superadmin`) endpoints are admin-only and must not expose client workspace content — metadata/statistics only.
- Never return or store secrets (password hashes, provider keys, webhook secrets) in GraphQL types or logs.
- Filters like `workspaceId` from the client must always be intersected with the caller's membership.

## Testing

- One Jest suite per resolver/service in `src/**/**.spec.ts`.
- Cover: success path, unauthenticated access, insufficient role, and cross-workspace rejection for every tenant-aware operation.
- e2e suites live in `test/` with the dedicated jest config; keep them independent of external services available in CI (PostgreSQL/Redis containers).

## Commits

- Atomic per logical change; conventional lowercase subject (e.g. `fix: enforce workspace membership for stage updates`).
- Run `format:check`, `lint`, `test`, and `build` before requesting review.
