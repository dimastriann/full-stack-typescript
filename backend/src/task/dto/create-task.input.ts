import { InputType, Int, Field, registerEnumType } from '@nestjs/graphql';
import { TaskStatus } from '../../../prisma/generated/client';

registerEnumType(TaskStatus, {
  name: 'TaskStatus',
});

@InputType()
export class CreateTaskInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => TaskStatus, { defaultValue: TaskStatus.TODO })
  status: TaskStatus;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  projectId: number;
}
