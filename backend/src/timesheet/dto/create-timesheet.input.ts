import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateTimesheetInput {
  @Field()
  description: string;

  @Field()
  date: Date;

  @Field()
  timeSpent: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  projectId: number;

  @Field(() => Int)
  taskId: number;
}
