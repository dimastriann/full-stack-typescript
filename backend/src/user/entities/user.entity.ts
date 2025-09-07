import { ObjectType, Field } from '@nestjs/graphql';
import { Base } from 'src/base/entities/base.entity';
import { Comment as CommentChat } from 'src/comment/entities/comment.entity';
import { Project } from 'src/project/entities/project.entity';
import { Task } from 'src/task/entities/task.entity';
import { Timesheet } from 'src/timesheet/entities/timesheet.entity';

@ObjectType()
export class User extends Base {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  phone: string;

  @Field({ nullable: true })
  mobile: string;

  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName: string;

  @Field({ defaultValue: true })
  status: boolean;

  @Field({ nullable: true })
  address: string;

  @Field({ nullable: true })
  bio: string;

  @Field({ nullable: true })
  birthDate: Date;

  @Field()
  role: string;

  @Field(() => [Project], { nullable: 'items' })
  projects?: [Project];

  @Field(() => [Task], { nullable: 'items' })
  tasks?: [Task];

  @Field(() => [Timesheet], { nullable: 'items' })
  timesheets?: [Timesheet];

  @Field(() => [CommentChat], { nullable: 'items' })
  comments: [CommentChat];
}
