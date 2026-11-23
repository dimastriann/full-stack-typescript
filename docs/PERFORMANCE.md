# Performance budgets

Budgets exist to catch regressions cheaply, not to benchmark hardware.
Numbers are measured on a developer machine and intentionally carry headroom
for slower CI runners.

## Frontend bundle (enforced in every CI run)

`npm run build && npm run budget:bundle` in `frontend/`.

| Budget | Current | Limit |
| ------ | ------- | ----- |
| Total JS (gzip) | 626 KB | 750 KB |
| Total CSS (gzip) | 20 KB | 40 KB |
| Largest chunk (gzip) | 116 KB (`vendor-charts`) | 140 KB |

Override for a deliberate, reviewed change:

```bash
BUNDLE_BUDGET_TOTAL_JS_KB=800 npm run budget:bundle
```

Raise the limits in the same commit that grows the bundle, and explain why in
the commit message — the defaults are the guardrail.

Notes:

- Sizes are gzip level 9, matching what browsers transfer.
- Route-level code splitting means users rarely download the full total.
- PWA precache reflects the same assets; keep `vendor-*` splits intact so a
  change to one area does not inflate the entry chunk.

## API latency (opt-in / on demand)

`npm run perf:smoke` measures p50/p95 for the hottest authenticated GraphQL
reads against a running backend. It is **not** part of the PR pipeline
(shared runners make sub-100 ms numbers noisy); run it locally before release
work, or dispatch the `perf` workflow manually.

```bash
# backend running with seeded data
PERF_BASE_URL=http://localhost:3000 \
PERF_EMAIL=admin@gmail.com PERF_PASSWORD=admin \
npm run perf:smoke
```

| Query | p95 budget |
| ----- | ---------- |
| `me` | 300 ms |
| `projects` | 300 ms |
| `tasks` | 300 ms |
| `dashboardStats` | 300 ms |

Observed locally on the seeded demo dataset: p95 of 10–19 ms, so the budget is
~15× headroom. Any non-2xx response or GraphQL error fails the run regardless
of timing.

Knobs: `PERF_ITERATIONS` (default 30), `PERF_P95_BUDGET_MS` (default 300).

If a budget starts failing, first check dataset size and indexes before
loosening the number.
