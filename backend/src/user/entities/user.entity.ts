import { ObjectType, Field } from '@nestjs/graphql';
import { Base } from 'src/base/entities/base.entity';
import { Comment as CommentChat } from 'src/comment/entities/comment.entity';
import { ProjectMember } from 'src/project-member/entities/project-member.entity';
import { WorkspaceMember } from 'src/workspace/entities/workspace-member.entity';
import { Task } from 'src/task/entities/task.entity';
import { Timesheet } from 'src/timesheet/entities/timesheet.entity';

@ObjectType()
export class User extends Base {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  phone?: string | null;

  @Field({ nullable: true })
  mobile?: string | null;

  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName?: string | null;

  @Field({ defaultValue: true })
  status: boolean;

  @Field({ nullable: true })
  address?: string | null;

  @Field({ nullable: true })
  bio?: string | null;

  @Field({ nullable: true })
  birthDate?: Date | null;

  @Field()
  role: string;

  @Field(() => [ProjectMember], { nullable: 'items' })
  projectMemberships?: ProjectMember[];

  @Field(() => [WorkspaceMember], { nullable: 'items' })
  workspaceMembers?: WorkspaceMember[];

  @Field(() => [Task], { nullable: 'items' })
  tasks?: Task[];

  @Field(() => [Timesheet], { nullable: 'items' })
  timesheets?: Timesheet[];

  @Field(() => [CommentChat], { nullable: 'items' })
  comments?: CommentChat[];

  @Field(() => [Task], { nullable: 'items' })
  reportedTasks?: Task[];

  @Field(() => [Timesheet], { nullable: 'items' })
  approvedTimesheets?: Timesheet[];
}
