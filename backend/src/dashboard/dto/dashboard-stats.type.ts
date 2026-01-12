import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  activeProjects: number;

  @Field(() => Int)
  pendingTasks: number;
}
