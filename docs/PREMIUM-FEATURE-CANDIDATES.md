# Premium feature candidates

Candidates are evaluated for customer value, implementation effort, privacy risk,
and how cleanly they can consume Core extension contracts.

| Candidate | Value | Effort | Risk | Priority |
| --- | --- | --- | --- | --- |
| Advanced billing and subscription operations | High | Medium | Medium | 1 |
| SSO/SAML and SCIM provisioning | High | High | High | 2 |
| Audit-log export and compliance retention | High | Medium | Medium | 3 |
| Advanced automations and workflow rules | High | High | Medium | 4 |
| External integrations and scheduled sync | Medium | High | Medium | 5 |
| Managed backups and point-in-time restore | High | High | High | 6 |
| White-label branding and custom domains | Medium | Medium | Low | 7 |

## Recommendation

Start with advanced billing and subscription operations. Core already contains
plan limits and payment-provider abstractions, so Pro can add invoicing,
entitlements, customer-portal flows, and provider-specific operations without
coupling Core to private code.

The first implementation must be approved separately before Pro code is added.
