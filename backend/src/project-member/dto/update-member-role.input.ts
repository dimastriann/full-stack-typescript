import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt } from 'class-validator';
import { ProjectRole } from 'prisma/generated/enums';

/**
 * Input for updating a member's role in a project
 */
@InputType()
export class UpdateMemberRoleInput {
    @Field(() => Int)
    @IsInt()
    projectId: number;

    @Field(() => Int)
    @IsInt()
    userId: number;

    @Field(() => ProjectRole)
    @IsEnum(ProjectRole)
    role: ProjectRole;
}
