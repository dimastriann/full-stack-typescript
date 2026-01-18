import { InputType, Field, PartialType, Int } from '@nestjs/graphql';
import { CreateTaskStageInput } from './create-task-stage.input';

@InputType()
export class UpdateTaskStageInput extends PartialType(CreateTaskStageInput) {
  @Field(() => Int)
  id: number;
}
