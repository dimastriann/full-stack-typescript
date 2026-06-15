import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class PushSubscriptionEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field()
  endpoint: string;

  @Field()
  auth: string;

  @Field()
  p256dh: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
