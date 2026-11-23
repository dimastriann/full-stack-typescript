#!/usr/bin/env node
/**
 * API latency smoke test. Opt-in: it needs a running backend (and its
 * dependencies). Measures p50/p95 for the hottest GraphQL reads and fails
 * when any p95 exceeds the budget.
 *
 * Usage:
 *   PERF_BASE_URL=http://localhost:3000 \
 *   PERF_EMAIL=admin@gmail.com PERF_PASSWORD=admin \
 *   node scripts/perf-smoke.mjs
 */
const BASE_URL = process.env.PERF_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.PERF_EMAIL ?? process.env.E2E_USER_EMAIL ?? 'admin@gmail.com';
const PASSWORD = process.env.PERF_PASSWORD ?? process.env.E2E_USER_PASSWORD ?? 'admin';
const ITERATIONS = Number(process.env.PERF_ITERATIONS ?? 30);
const P95_BUDGET_MS = Number(process.env.PERF_P95_BUDGET_MS ?? 300);

const QUERIES = [
  { name: 'me', query: 'query { me { id email role } }' },
  {
    name: 'projects',
    query: 'query { projects { id name } }',
  },
  { name: 'tasks', query: 'query { tasks { id title } }' },
  { name: 'dashboardStats', query: 'query { dashboardStats { activeProjects pendingTasks overdueTasks } }' },
];

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function graphql(body, cookie) {
  const startedAt = performance.now();
  const response = await fetch(`${BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  const elapsed = performance.now() - startedAt;
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, elapsed, payload, headers: response.headers };
}

async function login() {
  const result = await graphql({
    query:
      'mutation ($email: String!, $password: String!) { login(email: $email, password: $password) { access_token } }',
    variables: { email: EMAIL, password: PASSWORD },
  });
  if (result.payload.errors) {
    throw new Error(`login failed: ${JSON.stringify(result.payload.errors)}`);
  }
  const setCookie = result.headers.getSetCookie?.() ?? [];
  return setCookie.map((cookie) => cookie.split(';')[0]).join('; ');
}

async function main() {
  console.log(
    `perf-smoke: ${BASE_URL} · ${ITERATIONS} iterations · p95 budget ${P95_BUDGET_MS}ms`,
  );

  const cookie = await login();
  let failed = false;

  for (const { name, query } of QUERIES) {
    const samples = [];
    let errors = 0;
    for (let i = 0; i < ITERATIONS; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const result = await graphql({ query }, cookie);
      samples.push(result.elapsed);
      if (result.status !== 200 || result.payload.errors) errors += 1;
    }
    const p50 = Math.round(percentile(samples, 50));
    const p95 = Math.round(percentile(samples, 95));
    const overBudget = p95 > P95_BUDGET_MS;
    if (overBudget || errors > 0) failed = true;
    console.log(
      `[${overBudget || errors > 0 ? 'FAIL' : 'ok  '}] ${name.padEnd(15)} p50 ${String(p50).padStart(4)}ms · p95 ${String(p95).padStart(4)}ms · errors ${errors}/${ITERATIONS}`,
    );
  }

  if (failed) {
    console.error('\nAPI latency budget exceeded or requests failed.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`perf-smoke failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
