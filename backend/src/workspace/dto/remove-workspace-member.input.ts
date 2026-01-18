import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class RemoveWorkspaceMemberInput {
  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  userId: number;
}
