import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Base } from 'src/base/entities/base.entity';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Comment as CommentChat } from 'src/comment/entities/comment.entity';
import { TaskStage } from 'src/task-stage/entities/task-stage.entity';

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
}
