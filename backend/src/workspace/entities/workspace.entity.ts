import { ObjectType, Field, Int } from '@nestjs/graphql';
import { WorkspaceMember } from './workspace-member.entity';
import { Project } from 'src/project/entities/project.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';

@ObjectType()
export class Workspace {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => [WorkspaceMember], { nullable: 'items' })
  members?: WorkspaceMember[];

  @Field(() => [Project], { nullable: 'items' })
  projects?: Project[];

  @Field(() => Subscription, { nullable: true })
  subscription?: Subscription | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
