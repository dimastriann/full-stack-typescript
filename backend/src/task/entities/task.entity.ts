import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Base } from 'src/base/entities/base.entity';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';

@ObjectType()
export class Task extends Base {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

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
}
