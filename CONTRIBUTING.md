# Contributing to ProjectFlow

Thank you for improving ProjectFlow. Contributions should keep the open-source core independently useful and avoid dependencies on unpublished commercial code.

## Development workflow

1. Create a focused branch from the current default branch.
2. Install root, backend, and frontend dependencies.
3. Copy the example environment files and configure PostgreSQL and Redis.
4. Make one cohesive change and add or update tests.
5. Run the repository quality commands before opening a pull request:

   ```bash
   npm run format
   npm run lint
   npm test
   npm run build
   ```

6. Explain behavior changes, migration requirements, and verification results in the pull request.

## Code organization

- Keep backend behavior inside its NestJS feature module.
- Keep frontend behavior inside the corresponding `src/features` area.
- Enforce authentication, authorization, and subscription limits on the backend. UI checks are not security controls.
- Scope workspace and project records in every query that handles tenant data.
- Use DTO validation for external input.
- Never commit credentials, customer data, database dumps, or generated environment files.
- Preserve backward compatibility or document the migration path.

## Database changes

Update `backend/prisma/schema.prisma` and create a committed Prisma migration. Do not edit an already released migration. Include migration and rollback considerations in the pull request.

## Tests

Prefer tests that verify observable behavior and permission boundaries. New modules should cover successful behavior, invalid input, unauthorized access, and cross-workspace access where applicable.

## Commits and pull requests

Use short imperative commit subjects, such as `document local development setup` or `enforce workspace access for webhooks`. Keep refactors separate from behavior changes when practical.

By contributing, you agree that your contribution is provided under the repository's MIT License.
