# ProjectFlow

ProjectFlow is a full-stack TypeScript project-management application and SaaS starter. It combines a NestJS GraphQL API with a React client and includes multi-workspace collaboration, access control, real-time features, subscriptions, and self-hosted deployment.

The project is being prepared as an open-source core that can support optional commercial extensions without making the community edition dependent on private code.

## Highlights

- Workspaces with owner, admin, member, and viewer roles
- Project-level membership and permissions
- Projects, tasks, subtasks, configurable stages, priorities, and custom fields
- List, Kanban, calendar, and Gantt views
- Comments, attachments, activity history, chat, and push notifications
- Manual and timer-based timesheets with approval fields
- JWT authentication, Redis-backed sessions, and two-factor authentication
- Dashboard statistics and platform administration
- Workspace subscriptions with Stripe, Xendit, and Midtrans provider adapters
- Signed webhooks and delivery logs
- PostgreSQL backups and PWA configuration
- Docker-based local or self-hosted deployment

## Technology

| Area       | Stack                                         |
| ---------- | --------------------------------------------- |
| Backend    | NestJS 11, TypeScript, GraphQL, Apollo Server |
| Data       | PostgreSQL, Prisma 7, Redis                   |
| Frontend   | React 19, Vite 7, Apollo Client, Zustand      |
| UI         | CSS, Tailwind CSS, Headless UI, Lucide        |
| Real time  | GraphQL subscriptions, Socket.IO              |
| Testing    | Jest, Vitest, Testing Library                 |
| Deployment | Docker Compose, Nginx, PWA                    |

## Requirements

- Node.js 24 is recommended. Prisma 7 requires a supported modern Node.js release.
- npm
- PostgreSQL
- Redis
- Docker and Docker Compose, if using the container workflow

## Quick start with Docker

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Replace the example secrets in `.env`.

3. Build and start the stack:

   ```bash
   docker compose up --build
   ```

4. Open `http://localhost:8080`.

The backend container applies committed Prisma migrations when it starts. Run the seed explicitly if you want development accounts and plan-limit records:

```bash
docker compose exec backend npx prisma db seed
```

The seed includes intentionally simple demo credentials. Never run it unchanged on an internet-facing production installation.

## Local development

Install all workspaces:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Create local configuration:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Update `backend/.env`, then prepare the database:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
cd ..
```

Start both applications from the repository root:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- GraphQL API: `http://localhost:3000/graphql`
- Health endpoint: `http://localhost:3000/health`

## Configuration

The templates [.env.example](.env.example), [backend/.env.example](backend/.env.example), and [frontend/.env.example](frontend/.env.example) document supported settings.

Required backend values:

| Variable         | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection URL                 |
| `JWT_SECRET_KEY` | Secret used to sign authentication tokens |

Common optional values:

| Variable                                                 | Purpose                                  |
| -------------------------------------------------------- | ---------------------------------------- |
| `FRONTEND_URL`                                           | Comma-separated allowed frontend origins |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`             | Session-store connection                 |
| `SENTRY_DSN`                                             | Error-reporting endpoint                 |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push configuration                   |
| `STRIPE_*`, `XENDIT_*`, `MIDTRANS_*`                     | Fallback payment-provider credentials    |
| `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`                | Account created by the seed script       |

Payment credentials can also be managed through the super-admin provider configuration. Do not commit real credentials or use the development defaults in production.

## Repository structure

```text
.
|-- backend/                 NestJS API, Prisma schema, migrations, and tests
|   |-- prisma/
|   `-- src/                 Feature-oriented NestJS modules
|-- frontend/                React application and component tests
|   `-- src/features/        Feature-oriented UI modules
|-- docs/                    Architecture and maintenance guidance
|-- .github/                 Contribution templates
`-- docker-compose.yml       Self-contained application stack
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the runtime and authorization model.

## Quality commands

Run these from the repository root:

```bash
npm run format
npm run lint
npm test
npm run build
```

Individual backend and frontend commands remain available through their own `package.json` files. The backend end-to-end suite requires its configured infrastructure.

## Open-source and commercial direction

The current repository is the open-source core. The intended architecture keeps it independently useful and introduces stable extension contracts before any commercial modules are separated. Premium code, hosted infrastructure, and secrets will not be committed here.

A detailed Core/Pro feature matrix will be approved before premium extraction begins.

## Contributing and support

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
- Report vulnerabilities according to [SECURITY.md](SECURITY.md), not in public issues.
- Use [SUPPORT.md](SUPPORT.md) to choose the right support channel.
- Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

ProjectFlow is licensed under the [MIT License](LICENSE).
