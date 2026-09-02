import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProjectStageService } from './project-stage.service';
import { ProjectStage } from './entities/project-stage.entity';
import { CreateProjectStageInput } from './dto/create-project-stage.input';
import { UpdateProjectStageInput } from './dto/update-project-stage.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Resolver(() => ProjectStage)
@UseGuards(GqlAuthGuard)
export class ProjectStageResolver {
  constructor(private readonly projectStageService: ProjectStageService) {}

  @Mutation(() => ProjectStage)
  createProjectStage(
    @Args('createProjectStageInput')
    createProjectStageInput: CreateProjectStageInput,
    @CurrentUser() user: User,
  ) {
    return this.projectStageService.create(createProjectStageInput, user.id);
  }

  @Query(() => [ProjectStage], { name: 'projectStages' })
  findAll(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @CurrentUser() user: User,
  ) {
    return this.projectStageService.findAll(workspaceId, user.id);
  }

  @Query(() => ProjectStage, { name: 'projectStage' })
  findOne(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ) {
    return this.projectStageService.findOne(id, user.id);
  }

  @Mutation(() => ProjectStage)
  updateProjectStage(
    @Args('updateProjectStageInput')
    updateProjectStageInput: UpdateProjectStageInput,
    @CurrentUser() user: User,
  ) {
    return this.projectStageService.update(
      updateProjectStageInput.id,
      updateProjectStageInput,
      user.id,
    );
  }

  @Mutation(() => ProjectStage)
  removeProjectStage(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ) {
    return this.projectStageService.remove(id, user.id);
  }
}
