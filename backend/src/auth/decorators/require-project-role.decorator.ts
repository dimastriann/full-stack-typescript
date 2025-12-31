import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from 'prisma/generated/enums';

/**
 * Metadata key for storing required project roles
 */
export const PROJECT_ROLES_KEY = 'projectRoles';

/**
 * Decorator to specify which roles are required to access a resolver
 * 
 * Usage:
 * @Mutation(() => Project)
 * @UseGuards(GqlAuthGuard, ProjectPermissionGuard)
 * @RequireProjectRole(ProjectRole.OWNER, ProjectRole.ADMIN)
 * async updateProject(
 *   @Args('id') id: number,
 *   @Args('input') input: UpdateProjectInput,
 *   @CurrentUser() user: User,
 * ) {
 *   return this.projectService.update(id, input, user.id);
 * }
 */
export const RequireProjectRole = (...roles: ProjectRole[]) =>
    SetMetadata(PROJECT_ROLES_KEY, roles);
