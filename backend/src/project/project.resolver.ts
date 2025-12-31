import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { ProjectAccessGuard } from 'src/auth/guards/project-access.guard';
import { ProjectPermissionGuard } from 'src/auth/guards/project-permission.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { RequireProjectRole } from 'src/auth/decorators/require-project-role.decorator';
import { ProjectRole } from 'prisma/generated/enums';

@Resolver(() => Project)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) { }

  /**
   * Create a new project - user is automatically added as OWNER
   */
  @Mutation(() => Project)
  @UseGuards(GqlAuthGuard)
  createProject(
    @Args('createProjectInput') createProjectInput: CreateProjectInput,
    @CurrentUser() user: any,
  ) {
    return this.projectService.create(createProjectInput, user.id);
  }

  /**
   * Get all projects the current user has access to
   */
  @Query(() => [Project])
  @UseGuards(GqlAuthGuard)
  projects(
    @CurrentUser() user: any,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.projectService.findAll(user.id, skip, take);
  }

  /**
   * Get a single project - verifies user has access
   */
  @Query(() => Project)
  @UseGuards(GqlAuthGuard, ProjectAccessGuard)
  project(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: any,
  ) {
    return this.projectService.findOne(id, user.id);
  }

  /**
   * Update a project - requires OWNER or ADMIN role
   */
  @Mutation(() => Project)
  @UseGuards(GqlAuthGuard, ProjectPermissionGuard)
  @RequireProjectRole(ProjectRole.OWNER, ProjectRole.ADMIN)
  updateProject(
    @Args('updateProjectInput') updateProjectInput: UpdateProjectInput,
    @CurrentUser() user: any,
  ) {
    return this.projectService.update(
      updateProjectInput.id,
      updateProjectInput,
      user.id,
    );
  }

  /**
   * Delete a project - requires OWNER role only
   */
  @Mutation(() => Project)
  @UseGuards(GqlAuthGuard, ProjectPermissionGuard)
  @RequireProjectRole(ProjectRole.OWNER)
  deleteProject(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: any,
  ) {
    return this.projectService.delete(id, user.id);
  }
}
