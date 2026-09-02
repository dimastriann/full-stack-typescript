import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TaskStageService } from './task-stage.service';
import { TaskStage } from './entities/task-stage.entity';
import { CreateTaskStageInput } from './dto/create-task-stage.input';
import { UpdateTaskStageInput } from './dto/update-task-stage.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Resolver(() => TaskStage)
@UseGuards(GqlAuthGuard)
export class TaskStageResolver {
  constructor(private readonly taskStageService: TaskStageService) {}

  @Mutation(() => TaskStage)
  createTaskStage(
    @Args('createTaskStageInput') createTaskStageInput: CreateTaskStageInput,
    @CurrentUser() user: User,
  ) {
    return this.taskStageService.create(createTaskStageInput, user.id);
  }

  @Query(() => [TaskStage], { name: 'taskStages' })
  findAll(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @CurrentUser() user: User,
  ) {
    return this.taskStageService.findAll(workspaceId, user.id);
  }

  @Query(() => TaskStage, { name: 'taskStage' })
  findOne(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ) {
    return this.taskStageService.findOne(id, user.id);
  }

  @Mutation(() => TaskStage)
  updateTaskStage(
    @Args('updateTaskStageInput') updateTaskStageInput: UpdateTaskStageInput,
    @CurrentUser() user: User,
  ) {
    return this.taskStageService.update(
      updateTaskStageInput.id,
      updateTaskStageInput,
      user.id,
    );
  }

  @Mutation(() => TaskStage)
  removeTaskStage(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ) {
    return this.taskStageService.remove(id, user.id);
  }
}
