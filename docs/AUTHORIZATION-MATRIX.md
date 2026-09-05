# Authorization and tenant boundaries

This inventory defines the intended access model for the Core application.

## Roles

- **Platform admin (`SUPERADMIN`)**: system operations only (global users, plans, billing, infrastructure metadata, bans). It must not receive client workspace, project, task, timesheet, document, or chat content unless explicitly granted organization membership.
- **Workspace owner/admin (`OWNER`, `ADMIN`)**: manages members, projects, stages, settings, and operational data inside workspaces where they are members.
- **Project roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`)**: limit project operations after workspace membership has been established.
- **Regular users**: access only resources granted through workspace/project membership and their own user-scoped records.

## Boundary inventory

| Boundary | Scope | Required enforcement |
| --- | --- | --- |
| Workspace queries and mutations | Workspace | Authenticated user + workspace membership; workspace owner/admin for management mutations |
| Project queries and mutations | Workspace/project | Workspace membership first, then project role |
| Project/task stages | Workspace | Workspace membership; owner/admin for stage management |
| Tasks and timesheets | Project/workspace | Project access plus operation-specific role checks |
| Chat and comments | Conversation/project | Authenticated participant or resource membership |
| Users and profiles | User/platform | Self access, permitted member management, or platform-admin system endpoint |
| Billing, plans, bans, backups, system analytics | Platform | Platform-admin role guard; expose aggregate metadata only |

## Review rules

1. Every resolver/controller must authenticate before loading tenant data.
2. A project role must never substitute for missing workspace membership.
3. Platform-admin status must not bypass tenant-content checks.
4. Cross-workspace identifiers must be rejected, not silently ignored.
5. Each boundary change requires unauthenticated, insufficient-role, and cross-tenant tests.
