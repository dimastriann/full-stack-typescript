import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { WorkspaceRole } from 'prisma/generated/enums';
import { User } from 'src/user/entities/user.entity';
import { Workspace } from './workspace.entity';

registerEnumType(WorkspaceRole, {
  name: 'WorkspaceRole',
});

@ObjectType()
export class WorkspaceMember {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Workspace, { nullable: true })
  workspace?: Workspace;

  @Field(() => Int)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => WorkspaceRole)
  role: WorkspaceRole;

  @Field()
  joinedAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
