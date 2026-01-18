import { InputType, Field, Int } from '@nestjs/graphql';
import { WorkspaceRole } from 'prisma/generated/enums';

@InputType()
export class UpdateWorkspaceMemberRoleInput {
  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  userId: number;

  @Field(() => WorkspaceRole)
  role: WorkspaceRole;
}
