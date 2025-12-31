import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { Timesheet } from './entities/timesheet.entity';
import { CreateTimesheetInput } from './dto/create-timesheet.input';
import { UpdateTimesheetInput } from './dto/update-timesheet.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => Timesheet)
export class TimesheetResolver {
  constructor(private readonly timesheetService: TimesheetService) { }

  @Mutation(() => Timesheet)
  @UseGuards(GqlAuthGuard)
  createTimesheet(
    @Args('createTimesheetInput') createTimesheetInput: CreateTimesheetInput,
    @CurrentUser() user: any,
  ) {
    return this.timesheetService.create(createTimesheetInput, user.id);
  }

  @Query(() => [Timesheet], { name: 'timesheets' })
  @UseGuards(GqlAuthGuard)
  findAll(
    @CurrentUser() user: any,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('taskId', { type: () => Int, nullable: true }) taskId?: number,
  ) {
    return this.timesheetService.findAll(user.id, skip, take, taskId);
  }

  @Query(() => Timesheet, { name: 'getTimesheet' })
  @UseGuards(GqlAuthGuard)
  findOne(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: any,
  ) {
    return this.timesheetService.findOne(id, user.id);
  }

  @Mutation(() => Timesheet)
  @UseGuards(GqlAuthGuard)
  updateTimesheet(
    @Args('updateTimesheetInput') updateTimesheetInput: UpdateTimesheetInput,
    @CurrentUser() user: any,
  ) {
    return this.timesheetService.update(
      updateTimesheetInput.id,
      updateTimesheetInput,
      user.id,
    );
  }

  @Mutation(() => Timesheet)
  @UseGuards(GqlAuthGuard)
  removeTimesheet(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: any,
  ) {
    return this.timesheetService.remove(id, user.id);
  }
}
