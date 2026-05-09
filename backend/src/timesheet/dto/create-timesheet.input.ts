import { InputType, Int, Field } from '@nestjs/graphql';
import { TimesheetSource } from '../../../prisma/generated/enums';

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

  @Field({ nullable: true })
  startTime?: Date;

  @Field({ nullable: true })
  endTime?: Date;

  @Field({ nullable: true, defaultValue: true })
  billable?: boolean;

  @Field(() => Number, { nullable: true })
  hourlyRate?: number;

  @Field(() => TimesheetSource, { nullable: true, defaultValue: TimesheetSource.MANUAL })
  source?: TimesheetSource;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
