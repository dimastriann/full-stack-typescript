import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ProjectMemberService } from 'src/project-member/project-member.service';

/**
 * Guard to verify user has access to a project
 * Checks if user is a member of the project (any role)
 *
 * This guard expects:
 * - User to be authenticated (use GqlAuthGuard first)
 * - A 'projectId' or 'id' argument in the GraphQL query/mutation
 *
 * Usage:
 * @Query(() => Project)
 * @UseGuards(GqlAuthGuard, ProjectAccessGuard)
 * async project(@Args('id') id: number, @CurrentUser() user: User) {
 *   return this.projectService.findOne(id, user.id);
 * }
 */
@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private projectMemberService: ProjectMemberService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      // If no projectId in args, this guard doesn't apply
      // (might be a mutation that creates a project)
      return true;
    }

    // Check if user has access to this project
    const hasAccess = await this.projectMemberService.checkAccess(
      user.id,
      projectId,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return true;
  }
}
