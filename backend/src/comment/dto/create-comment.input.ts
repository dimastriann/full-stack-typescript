import { InputType, Int, Field } from '@nestjs/graphql';
import { IsSanitizedString } from '../../common/decorators/sanitized-string.decorator';

@InputType()
export class CreateCommentInput {
  @Field()
  @IsSanitizedString()
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
