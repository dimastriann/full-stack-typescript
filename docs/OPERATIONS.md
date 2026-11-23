# Operations runbook

Deployment health, probes, and alerting guidance for ProjectFlow Core.

## Probes

| Endpoint           | Purpose                          | Success | Failure |
| ------------------ | -------------------------------- | ------- | ------- |
| `/health/liveness` | Process is alive (restart hint)  | `200`   | no response → restart container |
| `/health/readiness`| Traffic can be served (deps up)   | `200`   | `503` → remove from load balancer |
| `/health`          | Detailed status incl. memory     | `200`   | `503` when Postgres is down or heap > 1 GB |

`/health/readiness` checks **PostgreSQL and Redis** (Redis backs auth
sessions). Each probe is bounded at 2 seconds; a hung dependency yields
`status: "down"` with `error: "<name> probe timed out"` instead of hanging
the probe endpoint itself.

```json
{
  "status": "ready",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "checks": {
    "database": { "status": "up", "latencyMs": 3 },
    "redis": { "status": "up", "latencyMs": 1 }
  }
}
```

## Recommended wiring

- Kubernetes: `livenessProbe` → `/health/liveness`, `readinessProbe` →
  `/health/readiness` (initial delay ≥ 20 s; the API compiles/connects on boot).
- Docker Compose / bare metal: poll `/health/readiness` every 10 s, restart
  after 3 consecutive failures.

## Alerts worth paging on

- `readiness` failing for > 2 minutes (dependency outage).
- `/health` returning `degraded` (heap > 1 GB) for > 10 minutes.
- Sustained `429` rate from `POST /auth/refresh` (session refresh storm) or
  `Mutation.login` (credential stuffing) — both are throttled per client IP.

## Log signal

`LoggingInterceptor` emits one line per request with request id, caller user
id, IP, user agent, and duration, for example:

```
🚀 GraphQL QUERY | Query.projects | Caller: User(3) | IP: 10.0.0.5 | UA: ...
✅ GraphQL Query.projects completed in 12ms
```

Failed requests log `❌ ... failed in <n>ms | Error: <message>` and are
correlated by the `[IncomingRequest]` request id.

## Throttling knobs

| Variable                    | Default | Scope                        |
| --------------------------- | ------- | ---------------------------- |
| `THROTTLE_LIMIT`            | 100/min | global per-IP request budget |
| `THROTTLE_TTL_MS`           | 60000   | global window                |
| `THROTTLE_LOGIN_LIMIT`      | 5/min   | `Mutation.login`             |
| `THROTTLE_REGISTER_LIMIT`   | 3/min   | `Mutation.register`          |
| `THROTTLE_2FA_LIMIT`        | 10/min  | 2FA completion               |
| `THROTTLE_REFRESH_LIMIT`    | 10/min  | `POST /auth/refresh`         |
| `THROTTLE_SUBSCRIPTION_LIMIT` | 5/min | checkout creation            |

E2E runs raise these via `E2E_THROTTLE_LIMIT`; production defaults stay
untouched.

## Dependency notes

- **Redis is required for auth sessions.** Loss of Redis fails readiness;
  existing access tokens cannot be validated until it returns.
- Webhook endpoints (`POST /subscription/webhook/:provider`) intentionally
  return `400` for invalid signatures/tokens — providers should retry per
  their own schedule; ProjectFlow treats them as rejected, not transient.
