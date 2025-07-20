import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateProjectInput {
  // @Field(() => Int)
  // id?: number

  @Field()
  name: string

  @Field({nullable: true})
  description?: string
}
