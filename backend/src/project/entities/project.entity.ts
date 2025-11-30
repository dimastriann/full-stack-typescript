import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Task } from 'src/task/entities/task.entity';
import { Timesheet } from 'src/timesheet/entities/timesheet.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment as CommentChat } from 'src/comment/entities/comment.entity';

@ObjectType()
export class Project {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  status: string;

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
}
