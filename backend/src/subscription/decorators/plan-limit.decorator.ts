import { SetMetadata } from '@nestjs/common';

export type PlanLimitType = 'project' | 'member';

export const PLAN_LIMIT_KEY = 'plan_limit';

/**
 * Decorator that marks a resolver mutation with the plan-limit type to enforce.
 * Must be used together with @UseGuards(PlanLimitGuard).
 *
 * @example
 * @PlanLimit('project')
 * @UseGuards(GqlAuthGuard, PlanLimitGuard)
 * createProject(...) {}
 */
export const PlanLimit = (type: PlanLimitType) =>
  SetMetadata(PLAN_LIMIT_KEY, type);
