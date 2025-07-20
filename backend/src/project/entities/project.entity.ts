import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => Int)
    id: number

    @Field()
    name: string

    @Field()
    description: string
}
