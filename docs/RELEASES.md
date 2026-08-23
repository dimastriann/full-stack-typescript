# Releases and migrations

The project is currently pre-stable. Until a formal versioning policy is announced, changes may require manual upgrade steps and the latest default branch is the only supported line.

## Release checklist

1. Format, lint, test, and build the backend and frontend.
2. Validate the Prisma schema and apply migrations to an empty database.
3. Upgrade a copy of the previous release database.
4. Review environment-variable and deployment changes.
5. Update user-facing documentation and release notes.
6. Tag the tested revision using semantic versioning.

## Migration policy

- Never modify a migration included in a published release.
- Back up production data before applying migrations.
- Document long-running, destructive, or irreversible operations.
- Prefer additive migrations and staged data transitions.
- Test both clean installation and upgrade paths.
- Keep Core migrations independent from future Pro migrations.
