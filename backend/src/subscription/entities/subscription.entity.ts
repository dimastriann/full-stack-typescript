import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import {
  PlanLevel,
  SubscriptionStatus,
} from '../../../prisma/generated/client';

registerEnumType(PlanLevel, { name: 'PlanLevel' });
registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });

@ObjectType('WorkspaceSubscription')
export class Subscription {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => PlanLevel)
  planLevel: PlanLevel;

  @Field(() => SubscriptionStatus)
  status: SubscriptionStatus;

  @Field(() => String, { nullable: true })
  currentPeriodStart?: Date | null;

  @Field(() => String, { nullable: true })
  currentPeriodEnd?: Date | null;

  @Field()
  cancelAtPeriodEnd: boolean;
}
