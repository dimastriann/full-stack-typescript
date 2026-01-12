import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProjectMemberService } from './project-member.service';
import { ProjectMember } from './entities/project-member.entity';
import { InviteToProjectInput } from './dto/invite-to-project.input';
import { UpdateMemberRoleInput } from './dto/update-member-role.input';
import { RemoveMemberInput } from './dto/remove-member.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { ProjectAccessGuard } from 'src/auth/guards/project-access.guard';
import { ProjectPermissionGuard } from 'src/auth/guards/project-permission.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { RequireProjectRole } from 'src/auth/decorators/require-project-role.decorator';
import { ProjectRole } from 'prisma/generated/enums';
import { Project } from 'src/project/entities/project.entity';

@Resolver(() => ProjectMember)
export class ProjectMemberResolver {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

  /**
   * Get all members of a specific project
   * Requires: User must be a member of the project
   */
  @Query(() => [ProjectMember], { name: 'projectMembers' })
  @UseGuards(GqlAuthGuard, ProjectAccessGuard)
  async getProjectMembers(
    @Args('projectId', { type: () => Int }) projectId: number,
  ) {
    return this.projectMemberService.getProjectMembers(projectId);
  }

  /**
   * Get all projects the current user has access to
   * Returns projects with membership details
   */
  @Query(() => [ProjectMember], { name: 'myProjectMemberships' })
  @UseGuards(GqlAuthGuard)
  async getMyProjects(@CurrentUser() user: any) {
    return this.projectMemberService.getUserProjects(user.id);
  }

  /**
   * Get the current user's role in a specific project
   */
  @Query(() => String, { name: 'myRoleInProject', nullable: true })
  @UseGuards(GqlAuthGuard)
  async getMyRole(
    @Args('projectId', { type: () => Int }) projectId: number,
    @CurrentUser() user: any,
  ) {
    return this.projectMemberService.getUserRole(user.id, projectId);
  }

  /**
   * Invite a user to a project by email
   * Requires: OWNER or ADMIN role
   */
  @Mutation(() => ProjectMember)
  @UseGuards(GqlAuthGuard, ProjectPermissionGuard)
  @RequireProjectRole(ProjectRole.OWNER, ProjectRole.ADMIN)
  async inviteToProject(
    @Args('input') input: InviteToProjectInput,
    @CurrentUser() user: any,
  ) {
    return this.projectMemberService.inviteUser(
      input.projectId,
      user.id,
      input.email,
      input.role,
    );
  }

  /**
   * Update a member's role in a project
   * Requires: OWNER or ADMIN role
   */
  @Mutation(() => ProjectMember)
  @UseGuards(GqlAuthGuard, ProjectPermissionGuard)
  @RequireProjectRole(ProjectRole.OWNER, ProjectRole.ADMIN)
  async updateMemberRole(
    @Args('input') input: UpdateMemberRoleInput,
    @CurrentUser() user: any,
  ) {
    return this.projectMemberService.updateMemberRole(
      input.projectId,
      input.userId,
      input.role,
    );
  }

  /**
   * Remove a member from a project
   * Requires: OWNER or ADMIN role
   */
  @Mutation(() => ProjectMember)
  @UseGuards(GqlAuthGuard, ProjectPermissionGuard)
  @RequireProjectRole(ProjectRole.OWNER, ProjectRole.ADMIN)
  async removeMemberFromProject(
    @Args('input') input: RemoveMemberInput,
    @CurrentUser() user: any,
  ) {
    return this.projectMemberService.removeMember(
      input.projectId,
      input.userId,
    );
  }

  /**
   * Leave a project (remove yourself)
   * Any member can leave, but cannot leave if you're the last owner
   */
  @Mutation(() => ProjectMember)
  @UseGuards(GqlAuthGuard, ProjectAccessGuard)
  async leaveProject(
    @Args('projectId', { type: () => Int }) projectId: number,
    @CurrentUser() user: any,
  ) {
    return this.projectMemberService.removeMember(projectId, user.id);
  }
}
