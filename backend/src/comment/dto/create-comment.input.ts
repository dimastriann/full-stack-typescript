import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateCommentInput {
  @Field()
  content: string;

  @Field(() => Int)
  userId: number;

  @Field(() => Int, { nullable: true })
  projectId: number;

  @Field(() => Int, { nullable: true })
  taskId: number;

  @Field(() => Int, { nullable: true })
  parentId: number;
}
