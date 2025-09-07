import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Base } from 'src/base/entities/base.entity';
import { User } from 'src/user/entities/user.entity';
import { Project } from 'src/project/entities/project.entity';
import { Task } from 'src/task/entities/task.entity';

@ObjectType()
export class Comment extends Base {
  @Field()
  content: string;

  @Field(() => Int)
  userId: number;

  @Field(() => User)
  user: User;

  @Field(() => Int, { nullable: true })
  projectId: number;

  @Field(() => Project, { nullable: true })
  project: Project;

  @Field(() => Int, { nullable: true })
  taskId: number;

  @Field(() => Task, { nullable: true })
  task: Task;

  @Field(() => Int, { nullable: true })
  parentId: number;

  @Field(() => Comment, { nullable: true })
  parent: Comment;

  @Field(() => [Comment], { nullable: 'items' })
  replies: [Comment];
}
