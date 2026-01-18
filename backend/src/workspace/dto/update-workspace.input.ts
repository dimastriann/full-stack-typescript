import { InputType, Field, PartialType, Int } from '@nestjs/graphql';
import { CreateWorkspaceInput } from './create-workspace.input';

@InputType()
export class UpdateWorkspaceInput extends PartialType(CreateWorkspaceInput) {
  @Field(() => Int)
  id: number;
}
