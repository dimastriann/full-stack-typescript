import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateProjectInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  responsibleId: number;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int, { nullable: true })
  stageId?: number;

  @Field(() => Int, { nullable: true })
  sequence?: number;
}
