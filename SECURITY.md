# Security policy

## Reporting a vulnerability

Do not report vulnerabilities in public issues or discussions. Contact the repository owner privately through the security-reporting method configured on the repository. If private vulnerability reporting is enabled on GitHub, use the repository's **Security > Report a vulnerability** action.

Include the affected version, impact, reproduction steps, and any suggested mitigation. Avoid accessing data that does not belong to you and do not disrupt a running service while investigating.

## Supported versions

Until the first stable release, security fixes are applied to the latest code on the default branch. A version support table will be published when stable releases begin.

## Deployment responsibility

Example credentials and Compose defaults are for local development only. Operators are responsible for replacing secrets, terminating TLS, restricting network access, maintaining PostgreSQL and Redis, applying migrations, and backing up data.
