import { CreateTimesheetInput } from './create-timesheet.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { ApprovalStatus } from '../../../prisma/generated/enums';

@InputType()
export class UpdateTimesheetInput extends PartialType(CreateTimesheetInput) {
  @Field(() => Int)
  id: number;

  @Field(() => ApprovalStatus, { nullable: true })
  approvalStatus?: ApprovalStatus;

  @Field(() => Int, { nullable: true })
  approvedById?: number;

  @Field(() => Date, { nullable: true })
  approvedAt?: Date;

  @Field(() => Number, { nullable: true })
  cost?: number;
}
