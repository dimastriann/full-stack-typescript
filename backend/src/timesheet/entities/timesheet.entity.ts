import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Base } from 'src/base/entities/base.entity';
import { User } from 'src/user/entities/user.entity';
import { Project } from 'src/project/entities/project.entity';
import { Task } from 'src/task/entities/task.entity';
import { registerEnumType } from '@nestjs/graphql';
import {
  TimesheetSource,
  ApprovalStatus,
} from '../../../prisma/generated/enums';

registerEnumType(TimesheetSource, {
  name: 'TimesheetSource',
});

registerEnumType(ApprovalStatus, {
  name: 'ApprovalStatus',
});

@ObjectType()
export class Timesheet extends Base {
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

  @Field(() => User)
  user: User;

  @Field(() => Project)
  project: Project;

  @Field(() => Task)
  task: Task;

  @Field(() => Int)
  taskId: number;

  @Field(() => Date, { nullable: true })
  startTime?: Date;

  @Field(() => Date, { nullable: true })
  endTime?: Date;

  @Field({ defaultValue: true })
  billable: boolean;

  @Field(() => Number, { nullable: true })
  hourlyRate?: number;

  @Field(() => Number, { nullable: true })
  cost?: number;

  @Field(() => TimesheetSource, { defaultValue: TimesheetSource.MANUAL })
  source: TimesheetSource;

  @Field(() => ApprovalStatus, { defaultValue: ApprovalStatus.PENDING })
  approvalStatus: ApprovalStatus;

  @Field(() => Int, { nullable: true })
  approvedById?: number;

  @Field(() => User, { nullable: true })
  approvedBy?: User;

  @Field(() => Date, { nullable: true })
  approvedAt?: Date;

  @Field(() => [String], { nullable: 'items' })
  tags?: string[];
}
