import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SubscriptionService } from '../subscription.service';
import {
  PLAN_LIMIT_KEY,
  PlanLimitType,
} from '../decorators/plan-limit.decorator';

/**
 * Guard that enforces workspace plan limits on GQL mutations.
 *
 * It reads the limit type from the @PlanLimit() decorator and the
 * workspaceId from the GraphQL args, then delegates to SubscriptionService.
 *
 * On limit exceeded: throws BadRequestException with code PLAN_LIMIT_EXCEEDED.
 * The frontend detects this code and shows the PaywallModal.
 */
@Injectable()
export class PlanLimitGuard implements CanActivate {
  private readonly logger = new Logger(PlanLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.getAllAndOverride<PlanLimitType>(
      PLAN_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @PlanLimit() decorator, skip this guard
    if (!limitType) return true;

    const ctx = GqlExecutionContext.create(context);
    const args = ctx.getArgs<Record<string, unknown>>();

    // Extract workspaceId from GQL args — supports both flat and nested input objects
    const workspaceId = this._extractWorkspaceId(args);

    if (!workspaceId) {
      this.logger.warn(
        `PlanLimitGuard: could not extract workspaceId from args for limit type "${limitType}". Skipping check.`,
      );
      return true;
    }

    switch (limitType) {
      case 'project':
        await this.subscriptionService.checkProjectLimit(workspaceId);
        break;
      case 'member':
        await this.subscriptionService.checkMemberLimit(workspaceId);
        break;
    }

    return true;
  }

  /**
   * Tries to extract workspaceId from:
   *   1. Top-level arg: { workspaceId: 5 }
   *   2. Nested input object: { createProjectInput: { workspaceId: 5 } }
   *   3. Nested input object: { input: { workspaceId: 5 } }
   */
  private _extractWorkspaceId(
    args: Record<string, unknown>,
  ): number | undefined {
    // Direct top-level
    if (typeof args['workspaceId'] === 'number') return args['workspaceId'];

    // Nested inside any input object
    for (const val of Object.values(args)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const nested = val as Record<string, unknown>;
        if (typeof nested['workspaceId'] === 'number') {
          return nested['workspaceId'];
        }
      }
    }

    return undefined;
  }
}
