import { ObjectType, Field, Int } from '@nestjs/graphql';
import { WorkspaceMember } from './workspace-member.entity';
import { Project } from 'src/project/entities/project.entity';

@ObjectType()
export class Workspace {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [WorkspaceMember], { nullable: 'items' })
  members?: WorkspaceMember[];

  @Field(() => [Project], { nullable: 'items' })
  projects?: Project[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
