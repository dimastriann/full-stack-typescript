import { InputType, Int, Field, registerEnumType } from '@nestjs/graphql';

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

registerEnumType(ProjectStatus, {
  name: 'ProjectStatus',
  description: 'Project status',
});

@InputType()
export class CreateProjectInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  responsibleId: number;

  @Field(() => ProjectStatus, { defaultValue: ProjectStatus.DRAFT })
  status: ProjectStatus;
}
