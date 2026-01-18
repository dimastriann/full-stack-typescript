import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateTaskInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  projectId: number;

  @Field(() => Int, { nullable: true })
  stageId?: number;

  @Field(() => Int, { nullable: true })
  sequence?: number;
}
