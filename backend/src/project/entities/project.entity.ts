import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Task } from 'src/task/entities/task.entity';
import { Timesheet } from 'src/timesheet/entities/timesheet.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment as CommentChat } from 'src/comment/entities/comment.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { ProjectMember } from 'src/project-member/entities/project-member.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { ProjectStage } from 'src/project-stage/entities/project-stage.entity';
import { registerEnumType } from '@nestjs/graphql';
import {
  ProjectMethodology,
  ProjectVisibility,
  ProjectPriority,
} from '../../../prisma/generated/enums';

registerEnumType(ProjectVisibility, {
  name: 'ProjectVisibility',
});

registerEnumType(ProjectPriority, {
  name: 'ProjectPriority',
});

registerEnumType(ProjectMethodology, {
  name: 'ProjectMethodology',
});

@ObjectType()
export class Project {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Task], { nullable: 'items' })
  tasks?: [Task];

  @Field(() => [Timesheet], { nullable: 'items' })
  timesheets?: [Timesheet];

  @Field(() => User)
  responsible?: User;

  @Field(() => Int)
  responsibleId?: number;

  @Field(() => [CommentChat], { nullable: 'items' })
  comments?: [CommentChat];

  @Field(() => [Attachment], { nullable: 'items' })
  attachments?: [Attachment];

  @Field(() => [ProjectMember], { nullable: 'items' })
  members?: [ProjectMember];

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Workspace)
  workspace: Workspace;

  @Field(() => Int, { nullable: true })
  stageId?: number;

  @Field(() => ProjectStage, { nullable: true })
  stage?: ProjectStage;

  @Field(() => Int, { nullable: true })
  sequence?: number;

  @Field(() => Number, { defaultValue: 0 })
  budgetPlanned: number;

  @Field(() => Number, { defaultValue: 0 })
  budgetActual: number;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => Int, { defaultValue: 1 })
  phasesCount: number;

  @Field(() => ProjectMethodology, { defaultValue: ProjectMethodology.KANBAN })
  methodology: ProjectMethodology;

  @Field(() => String, { nullable: true })
  key?: string;

  @Field(() => ProjectVisibility, { defaultValue: ProjectVisibility.TEAM })
  visibility: ProjectVisibility;

  @Field(() => ProjectPriority, { defaultValue: ProjectPriority.MEDIUM })
  priority: ProjectPriority;

  @Field(() => Date, { nullable: true })
  actualStartDate?: Date;

  @Field(() => Date, { nullable: true })
  actualEndDate?: Date;

  @Field(() => Number, { defaultValue: 0 })
  progress: number;

  @Field({ defaultValue: 'USD' })
  currency: string;

  @Field(() => [String], { nullable: 'items' })
  tags?: string[];

  @Field(() => Date, { nullable: true })
  archivedAt?: Date;

  @Field(() => Number, { defaultValue: 0 })
  totalHours?: number;
}
