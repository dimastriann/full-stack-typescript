import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardStats } from './dto/dashboard-stats.type';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardStats)
  @UseGuards(GqlAuthGuard)
  async dashboardStats(@CurrentUser() user: User) {
    return this.dashboardService.getStats(user.id);
  }
}
