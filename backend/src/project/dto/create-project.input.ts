import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateProjectInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  responsibleId: number;
}
