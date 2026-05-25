import { InputType, Int, Field } from '@nestjs/graphql';
import { TaskPriority, TaskType } from '../../../prisma/generated/enums';
import { IsSanitizedString } from '../../common/decorators/sanitized-string.decorator';

@InputType()
export class CreateTaskInput {
  @Field()
  @IsSanitizedString()
  title: string;

  @Field({ nullable: true })
  @IsSanitizedString()
  description?: string;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  projectId: number;

  @Field(() => Int, { nullable: true })
  stageId?: number;

  @Field(() => Int, { nullable: true })
  sequence?: number;

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  estimatedHours?: number;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field(() => TaskPriority, {
    nullable: true,
    defaultValue: TaskPriority.MEDIUM,
  })
  priority?: TaskPriority;

  @Field(() => Int, { nullable: true })
  parentTaskId?: number;

  @Field(() => TaskType, { nullable: true, defaultValue: TaskType.TASK })
  type?: TaskType;

  @Field(() => Int, { nullable: true })
  reporterId?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
