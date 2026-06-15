import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PlanLimitGuard } from './plan-limit.guard';
import { PLAN_LIMIT_KEY } from '../decorators/plan-limit.decorator';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockSubscriptionService = {
  checkProjectLimit: jest.fn().mockResolvedValue(undefined),
  checkMemberLimit: jest.fn().mockResolvedValue(undefined),
};

function buildContext(gqlArgs: Record<string, unknown>): ExecutionContext {
  const mockGqlCtx = {
    getArgs: jest.fn().mockReturnValue(gqlArgs),
  };
  jest
    .spyOn(GqlExecutionContext, 'create')
    .mockReturnValue(mockGqlCtx as never);

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('PlanLimitGuard', () => {
  let guard: PlanLimitGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new PlanLimitGuard(reflector, mockSubscriptionService as never);
  });

  it('returns true immediately when no @PlanLimit decorator is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = buildContext({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockSubscriptionService.checkProjectLimit).not.toHaveBeenCalled();
  });

  it('extracts workspaceId from flat GQL args and calls checkProjectLimit', async () => {
    reflector.getAllAndOverride.mockReturnValue('project');
    const ctx = buildContext({ workspaceId: 7 });

    await guard.canActivate(ctx);

    expect(mockSubscriptionService.checkProjectLimit).toHaveBeenCalledWith(7);
  });

  it('extracts workspaceId from nested input object and calls checkMemberLimit', async () => {
    reflector.getAllAndOverride.mockReturnValue('member');
    const ctx = buildContext({
      inviteToWorkspaceInput: { workspaceId: 12, email: 'x@test.com' },
    });

    await guard.canActivate(ctx);

    expect(mockSubscriptionService.checkMemberLimit).toHaveBeenCalledWith(12);
  });

  it('extracts workspaceId from generic "input" nested object', async () => {
    reflector.getAllAndOverride.mockReturnValue('project');
    const ctx = buildContext({
      input: { workspaceId: 99, name: 'New Project' },
    });

    await guard.canActivate(ctx);

    expect(mockSubscriptionService.checkProjectLimit).toHaveBeenCalledWith(99);
  });

  it('skips check gracefully when workspaceId cannot be extracted', async () => {
    reflector.getAllAndOverride.mockReturnValue('project');
    const ctx = buildContext({ someOtherArg: 'hello' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockSubscriptionService.checkProjectLimit).not.toHaveBeenCalled();
  });

  it('propagates BadRequestException thrown by checkProjectLimit', async () => {
    reflector.getAllAndOverride.mockReturnValue('project');
    const ctx = buildContext({ workspaceId: 3 });

    const { BadRequestException } = await import('@nestjs/common');
    mockSubscriptionService.checkProjectLimit.mockRejectedValue(
      new BadRequestException({
        code: 'PLAN_LIMIT_EXCEEDED',
        message: 'Max projects reached',
        limit: 5,
        current: 5,
      }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
  });

  it('verifies PLAN_LIMIT_KEY constant is used for reflector lookup', async () => {
    reflector.getAllAndOverride.mockReturnValue('member');
    const ctx = buildContext({ workspaceId: 1 });

    await guard.canActivate(ctx);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      PLAN_LIMIT_KEY,
      expect.any(Array),
    );
  });
});
