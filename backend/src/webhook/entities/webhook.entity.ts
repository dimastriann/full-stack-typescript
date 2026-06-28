import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class WebhookDeliveryLog {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  webhookEndpointId: number;

  @Field()
  event: string;

  /** Stored as Json; resolved as stringified JSON in the resolver. */
  @Field(() => String)
  payload: string;

  @Field(() => Int, { nullable: true })
  statusCode?: number;

  @Field({ nullable: true })
  responseBody?: string;

  @Field(() => Int)
  durationMs: number;

  @Field()
  success: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class WebhookEndpoint {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  workspaceId: number;

  @Field()
  url: string;

  @Field()
  name: string;

  @Field()
  secret: string;

  @Field(() => [String])
  events: string[];

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [WebhookDeliveryLog], { nullable: 'items' })
  deliveryLogs?: WebhookDeliveryLog[];
}
