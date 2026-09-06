const baseUrl = (process.env.SMOKE_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const health = await fetch(`${baseUrl}/health`);
if (!health.ok) throw new Error(`Health check failed: ${health.status}`);

const graphql = await fetch(`${baseUrl}/graphql`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query: '{ __typename }' }),
});
if (!graphql.ok) throw new Error(`GraphQL check failed: ${graphql.status}`);

const payload = await graphql.json();
if (payload.errors?.length) throw new Error(`GraphQL returned errors: ${JSON.stringify(payload.errors)}`);

console.log(`Smoke test passed for ${baseUrl}`);
