# Architecture

## Runtime overview

```text
Browser / installed PWA
        |
        | HTTP, GraphQL, WebSocket
        v
Nginx in production
        |
        v
NestJS application
   |             |
   v             v
PostgreSQL      Redis
```

The React client uses Apollo Client for GraphQL and Zustand or React context for local application state. Nginx serves the production client and proxies API, attachment, administration, PWA, and Socket.IO traffic to NestJS.

NestJS is organized by business capability. Prisma provides PostgreSQL access, while Redis stores revocable authentication sessions. GraphQL subscriptions and Socket.IO support real-time behavior.

## Domain boundaries

- **Identity:** users, login, token refresh, sessions, and two-factor authentication
- **Tenancy:** workspaces, workspace members, subscriptions, and limits
- **Delivery:** projects, tasks, configurable stages, comments, attachments, and timesheets
- **Collaboration:** chat, notifications, activity logs, and webhooks
- **Customization:** custom fields and PWA settings
- **Operations:** health checks, analytics snapshots, backups, payment configuration, and super-admin tools

## Authorization model

Authorization has three layers:

1. A global `UserRole` controls platform administration.
2. A `WorkspaceRole` controls membership and workspace administration.
3. A `ProjectRole` controls access to an individual project.

Resolvers and controllers authenticate requests with guards. Services must still verify ownership or membership when loading tenant records. Frontend route and component checks improve presentation but are not authorization boundaries.

Every new tenant-aware operation should be tested for:

- unauthenticated access;
- a valid member with sufficient permissions;
- a valid member with insufficient permissions; and
- a user belonging to a different workspace.

## Data and migrations

PostgreSQL is the only active database provider. The Prisma schema is in `backend/prisma/schema.prisma`, generated client code is in `backend/prisma/generated`, and committed migrations are applied in order.

Released migrations are immutable. Schema changes require a new migration and a documented upgrade impact. Seed data is intended for development and demonstration, not production provisioning.

## Open-core direction

The public application must start, build, migrate, and operate without commercial packages. Core owns shared contracts and default implementations. Future Pro modules may depend on those contracts, but Core must never import Pro.

The planned extension boundaries include entitlements, backend modules, frontend routes and navigation, storage, payments, automation, integrations, audit export, and backups. These boundaries will be introduced and tested before premium source is extracted.

## Operational boundaries

The repository provides application containers but does not currently provide a complete production platform. Production operators must supply TLS, secret management, durable storage, monitoring, alerting, backups, restore testing, and an upgrade process.
