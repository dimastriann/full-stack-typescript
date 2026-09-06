# Deployment smoke and restore test

Run the smoke test after deployment:

```sh
SMOKE_BASE_URL=https://api.example.com npm run smoke
```

It verifies the health endpoint and executes a minimal GraphQL request. A non-2xx response or GraphQL error fails the command.

Restore test procedure:

1. Create a disposable PostgreSQL database using the same major version as production.
2. Restore the latest backup into that database.
3. Run `npm run --prefix backend exec -- prisma migrate deploy` against the restored database.
4. Start the backend with the restored `DATABASE_URL` and run the smoke test.
5. Confirm login, workspace listing, and one representative read-only query.
6. Record the restore timestamp, backup identifier, migration result, and any corrective action.

Never run restore tests against the production database. Keep backup credentials and restored data isolated.
