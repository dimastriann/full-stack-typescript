import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Base } from 'src/base/entities/base.entity';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Comment as CommentChat } from 'src/comment/entities/comment.entity';
import { TaskStage } from 'src/task-stage/entities/task-stage.entity';
import { registerEnumType } from '@nestjs/graphql';
import { TaskPriority, TaskType } from '../../../prisma/generated/enums';

registerEnumType(TaskPriority, {
  name: 'TaskPriority',
});

registerEnumType(TaskType, {
  name: 'TaskType',
});

@ObjectType()
export class Task extends Base {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  projectId: number;

  @Field(() => User)
  user: User;

  @Field(() => Project)
  project: Project;

  @Field(() => [Attachment], { nullable: 'items' })
  attachments?: [Attachment];

  @Field(() => [CommentChat], { nullable: 'items' })
  comments?: [CommentChat];

  @Field(() => Int, { nullable: true })
  stageId?: number;

  @Field(() => TaskStage, { nullable: true })
  stage?: TaskStage;

  @Field(() => Int, { nullable: true })
  sequence?: number;

  @Field(() => Number, { defaultValue: 0 })
  estimatedHours: number;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field(() => TaskPriority, { defaultValue: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Field(() => Number, { defaultValue: 0 })
  actualHours?: number;

  @Field(() => Int, { nullable: true })
  parentTaskId?: number;

  @Field(() => Task, { nullable: true })
  parentTask?: Task;

  @Field(() => [Task], { nullable: 'items' })
  subtasks?: Task[];

  @Field(() => TaskType, { defaultValue: TaskType.TASK })
  type: TaskType;

  @Field(() => Int, { nullable: true })
  reporterId?: number;

  @Field(() => User, { nullable: true })
  reporter?: User;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => Number, { defaultValue: 0 })
  remainingHours: number;

  @Field(() => Number, { defaultValue: 0 })
  progress: number;

  @Field(() => [String], { nullable: 'items' })
  tags?: string[];

  @Field({ nullable: true })
  deletedAt?: Date;
}
