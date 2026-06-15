import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../../../prisma/generated/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    let user: { role: UserRole } | undefined;

    if (context.getType<string>() === 'graphql') {
      // GraphQL context
      const ctx = GqlExecutionContext.create(context);
      const gqlCtx = ctx.getContext<{ req: { user?: { role: UserRole } } }>();
      user = gqlCtx.req?.user;
    } else {
      // REST / HTTP context
      const request = context
        .switchToHttp()
        .getRequest<{ user?: { role: UserRole } }>();
      user = request.user;
    }

    if (!user) {
      return false;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
