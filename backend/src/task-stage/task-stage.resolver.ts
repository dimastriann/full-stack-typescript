import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TaskStageService } from './task-stage.service';
import { TaskStage } from './entities/task-stage.entity';
import { CreateTaskStageInput } from './dto/create-task-stage.input';
import { UpdateTaskStageInput } from './dto/update-task-stage.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';

@Resolver(() => TaskStage)
@UseGuards(GqlAuthGuard)
export class TaskStageResolver {
    constructor(private readonly taskStageService: TaskStageService) { }

    @Mutation(() => TaskStage)
    createTaskStage(
        @Args('createTaskStageInput') createTaskStageInput: CreateTaskStageInput,
    ) {
        return this.taskStageService.create(createTaskStageInput);
    }

    @Query(() => [TaskStage], { name: 'taskStages' })
    findAll(@Args('workspaceId', { type: () => Int }) workspaceId: number) {
        return this.taskStageService.findAll(workspaceId);
    }

    @Query(() => TaskStage, { name: 'taskStage' })
    findOne(@Args('id', { type: () => Int }) id: number) {
        return this.taskStageService.findOne(id);
    }

    @Mutation(() => TaskStage)
    updateTaskStage(
        @Args('updateTaskStageInput') updateTaskStageInput: UpdateTaskStageInput,
    ) {
        return this.taskStageService.update(
            updateTaskStageInput.id,
            updateTaskStageInput,
        );
    }

    @Mutation(() => TaskStage)
    removeTaskStage(@Args('id', { type: () => Int }) id: number) {
        return this.taskStageService.remove(id);
    }
}
