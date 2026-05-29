import { CreateTaskInput } from './create-task.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateTaskInput extends PartialType(CreateTaskInput) {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => Number, { nullable: true })
  remainingHours?: number;

  @Field(() => Number, { nullable: true })
  progress?: number;

  @Field({ nullable: true })
  deletedAt?: Date;
}
