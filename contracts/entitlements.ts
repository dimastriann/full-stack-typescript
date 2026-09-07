/**
 * Core-owned entitlement contract. Pro may provide a resolver, while Core
 * remains fully functional when no resolver is registered.
 */
export const ENTITLEMENTS = [
  'advancedAnalytics',
  'sso',
  'workflowAutomation',
  'managedBackups',
  'premiumIntegrations',
] as const;

export type Entitlement = (typeof ENTITLEMENTS)[number];
export type EntitlementResolver = (key: Entitlement) => boolean;

/** Core default: every optional extension is available to self-hosted users. */
export const allowAllEntitlements: EntitlementResolver = () => true;

export function hasEntitlement(
  key: Entitlement,
  resolver: EntitlementResolver = allowAllEntitlements,
): boolean {
  return resolver(key);
}
