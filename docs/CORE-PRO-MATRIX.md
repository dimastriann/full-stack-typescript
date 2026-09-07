# Core versus Pro feature matrix

The public repository is the complete, useful Core product. Pro extensions must be optional and must never be required to build, run, or migrate Core.

| Capability | Core (open source) | Pro (private extension) |
| --- | --- | --- |
| Authentication, sessions, and 2FA | Included | Advanced SSO/SAML and SCIM provisioning |
| Workspaces, members, roles, and project permissions | Included | Organization-wide policy automation |
| Projects, tasks, stages, Kanban, list, calendar, and Gantt | Included | Advanced portfolio planning and capacity forecasting |
| Timesheets and basic reporting | Included | Advanced utilization, cost, and profitability analytics |
| Comments, chat, notifications, and file attachments | Included | Retention policies, compliance export, and advanced collaboration controls |
| PostgreSQL persistence and self-hosted deployment | Included | Managed hosting and high-availability operations |
| Webhooks and basic integrations | Included | Premium connectors, workflow automation, and event pipelines |
| Billing and plan-limit framework | Included as extension-ready infrastructure | Commercial plans, metering, and hosted billing operations |
| Backups and restore documentation | Included for self-hosting | Managed backups, point-in-time recovery, and support |

## Boundary rules

- Core owns stable interfaces for entitlements, extension registration, navigation, storage, payments, and integrations.
- Pro may implement those interfaces but must not modify Core source or require private imports in Core.
- Entitlements are enforced on the backend; frontend checks are presentation-only.
- Premium features must fail closed when an entitlement is unavailable, without exposing client data across tenants.
- Licensing, hosted infrastructure, commercial connectors, and private implementation details remain outside the Core repository.
