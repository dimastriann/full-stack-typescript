import { ExecutionContext } from '@nestjs/common';
import { GqlThrottlerGuard } from './gql-throttler.guard';

class TestGqlThrottlerGuard extends GqlThrottlerGuard {
  resolveRequestResponse(context: ExecutionContext) {
    return this.getRequestResponse(context);
  }
}

describe('GqlThrottlerGuard', () => {
  it('uses the GraphQL request and response for rate-limit tracking', () => {
    const req = { ip: '127.0.0.1' };
    const res = { setHeader: jest.fn() };
    const context = {
      getType: () => 'graphql',
      getArgs: () => [undefined, undefined, { req, res }, undefined],
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;
    const guard = new TestGqlThrottlerGuard([], {} as never, {} as never);

    expect(guard.resolveRequestResponse(context)).toEqual({ req, res });
  });
});
