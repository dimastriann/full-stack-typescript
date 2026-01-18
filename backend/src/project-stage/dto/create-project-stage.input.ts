import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateProjectStageInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ defaultValue: '#808080' })
  color: string;

  @Field({ defaultValue: false })
  isCompleted: boolean;

  @Field({ defaultValue: false })
  isCanceled: boolean;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int, { defaultValue: 5 })
  sequence: number;
}
