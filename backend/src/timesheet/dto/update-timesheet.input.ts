import { CreateTimesheetInput } from './create-timesheet.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateTimesheetInput extends PartialType(CreateTimesheetInput) {
  @Field(() => Int)
  id: number;
}
