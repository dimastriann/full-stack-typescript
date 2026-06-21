import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { ActivityLogService } from './activity-log.service';
import { ActivityLog } from './entities/activity-log.entity';

@Resolver(() => ActivityLog)
export class ActivityLogResolver {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Query(() => [ActivityLog], { name: 'activityLogs' })
  @UseGuards(GqlAuthGuard)
  async getActivityLogs(
    @CurrentUser() user: User,
    @Args('workspaceId', { type: () => Int, nullable: true }) workspaceId?: number,
    @Args('projectId', { type: () => Int, nullable: true }) projectId?: number,
    @Args('entityType', { type: () => String, nullable: true }) entityType?: string,
    @Args('entityId', { type: () => Int, nullable: true }) entityId?: number,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.activityLogService.findAll(user.id, {
      workspaceId,
      projectId,
      entityType,
      entityId,
      skip,
      take,
    });
  }

  @ResolveField(() => String, { name: 'details', nullable: true })
  resolveDetails(@Parent() log: ActivityLog): string | null {
    if (!log.details) return null;
    return typeof log.details === 'string'
      ? log.details
      : JSON.stringify(log.details);
  }
}
