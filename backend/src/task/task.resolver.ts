import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Resolver(() => Task)
export class TaskResolver {
  constructor(
    private readonly taskService: TaskService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => Task)
  @UseGuards(GqlAuthGuard)
  createTask(
    @Args('createTaskInput') createTaskInput: CreateTaskInput,
    @CurrentUser() user: any,
  ) {
    return this.taskService.create(createTaskInput, user.id);
  }

  @Query(() => [Task])
  @UseGuards(GqlAuthGuard)
  tasks(
    @CurrentUser() user: any,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('projectId', { type: () => Int, nullable: true }) projectId?: number,
    @Args('cursor', { type: () => Int, nullable: true }) cursor?: number,
  ) {
    return this.taskService.findAll(user.id, skip, take, projectId, cursor);
  }

  @Query(() => Task)
  @UseGuards(GqlAuthGuard)
  getTask(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: any,
  ) {
    return this.taskService.findOne(id, user.id);
  }

  @Mutation(() => Task)
  @UseGuards(GqlAuthGuard)
  updateTask(
    @Args('updateTaskInput') updateTaskInput: UpdateTaskInput,
    @CurrentUser() user: any,
  ) {
    return this.taskService.update(
      updateTaskInput.id,
      updateTaskInput,
      user.id,
    );
  }

  @Mutation(() => Task)
  @UseGuards(GqlAuthGuard)
  removeTask(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: any,
  ) {
    return this.taskService.remove(id, user.id);
  }

  @ResolveField(() => Number)
  async actualHours(@Parent() task: Task) {
    const result = await this.prisma.timesheet.aggregate({
      where: { taskId: task.id },
      _sum: { timeSpent: true },
    });
    return result._sum.timeSpent || 0;
  }
}
