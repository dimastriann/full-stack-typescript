import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateWorkspaceInput {
    @Field()
    name: string;

    @Field({ nullable: true })
    description?: string;
}
