import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TaskStage {
    @Field(() => Int)
    id: number;

    @Field()
    title: string;

    @Field({ nullable: true })
    description?: string;

    @Field()
    color: string;

    @Field()
    isCompleted: boolean;

    @Field()
    isCanceled: boolean;

    @Field(() => Int)
    workspaceId: number;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
