import { InputType, Int, Field } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';

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
