import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Project } from 'src/project/entities/project.entity';

@ObjectType()
export class ActivityLog {
  @Field(() => Int)
  id: number;

  @Field()
  action: string;

  @Field()
  entityType: string;

  @Field(() => Int)
  entityId: number;

  @Field(() => Int, { nullable: true })
  workspaceId?: number;

  @Field(() => Int, { nullable: true })
  projectId?: number;

  @Field(() => Int)
  userId: number;

  @Field(() => String, { nullable: true })
  details?: string;

  @Field()
  createdAt: Date;

  @Field(() => User)
  user: User;

  @Field(() => Workspace, { nullable: true })
  workspace?: Workspace;

  @Field(() => Project, { nullable: true })
  project?: Project;
}
