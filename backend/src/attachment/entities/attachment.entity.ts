import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Attachment {
  @Field(() => Int)
  id: number;

  @Field()
  filename: string;

  @Field()
  path: string;

  @Field()
  mimeType: string;

  @Field(() => Int)
  size: number;

  @Field()
  createdAt: Date;
}
