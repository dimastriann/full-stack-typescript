import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Base } from 'src/base/entities/base.entity';
import { User } from 'src/user/entities/user.entity';
import { Project } from 'src/project/entities/project.entity';

@ObjectType()
export class Timesheet extends Base {
  @Field()
  description: string;

  @Field()
  date: Date;

  @Field()
  timeSpent: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  projectId: number;

  @Field(() => User)
  user: User;

  @Field(() => Project)
  project: Project;
}
