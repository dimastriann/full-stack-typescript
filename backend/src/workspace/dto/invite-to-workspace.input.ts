import { InputType, Field, Int } from '@nestjs/graphql';
import { WorkspaceRole } from 'prisma/generated/enums';

@InputType()
export class InviteToWorkspaceInput {
  @Field(() => Int)
  workspaceId: number;

  @Field()
  email: string;

  @Field(() => WorkspaceRole, { defaultValue: WorkspaceRole.MEMBER })
  role: WorkspaceRole;
}
