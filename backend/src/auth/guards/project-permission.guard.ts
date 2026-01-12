import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import { PROJECT_ROLES_KEY } from '../decorators/require-project-role.decorator';

/**
 * Guard to verify user has specific role(s) in a project
 * Works with @RequireProjectRole decorator
 *
 * This guard expects:
 * - User to be authenticated (use GqlAuthGuard first)
 * - A 'projectId' or 'id' argument in the GraphQL query/mutation
 * - @RequireProjectRole decorator to specify required roles
 *
 * Usage:
 * @Mutation(() => Project)
 * @UseGuards(GqlAuthGuard, ProjectPermissionGuard)
 * @RequireProjectRole(ProjectRole.OWNER, ProjectRole.ADMIN)
 * async deleteProject(@Args('id') id: number, @CurrentUser() user: User) {
 *   return this.projectService.delete(id, user.id);
 * }
 */
@Injectable()
export class ProjectPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private projectMemberService: ProjectMemberService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      PROJECT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const args = ctx.getArgs();

    // Get the authenticated user
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Try to get projectId from various argument names
    const projectId = args.projectId || args.id || args.input?.projectId;

    if (!projectId) {
      throw new ForbiddenException('Project ID not found in request');
    }

    // Check if user has one of the required roles
    try {
      await this.projectMemberService.checkPermission(
        user.id,
        projectId,
        requiredRoles,
      );
      return true;
    } catch (error) {
      // checkPermission throws ForbiddenException if user doesn't have permission
      throw error;
    }
  }
}
