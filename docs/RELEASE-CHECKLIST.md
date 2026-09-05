# Release checklist

Before publishing a release or deploying `main`:

- Confirm CI is green for install, formatting, lint, tests, builds, Prisma validation, generated-client consistency, and production dependency audits.
- Review database migrations and run them against a disposable database before production.
- Verify required environment variables and rotate any exposed credentials.
- Build and smoke-test backend health and frontend login in the target environment.
- Confirm backups and restore procedures were tested recently.
- Record migration, rollback, and user-visible changes in `docs/RELEASES.md`.

CI failures are release blockers. High or critical production dependency vulnerabilities must be fixed or explicitly documented with an owner and deadline; formatting, generated-client, migration, and test failures must not be waived.
