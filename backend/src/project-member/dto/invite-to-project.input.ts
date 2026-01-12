import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsInt } from 'class-validator';
import { ProjectRole } from 'prisma/generated/enums';

/**
 * Input for inviting a user to a project
 */
@InputType()
export class InviteToProjectInput {
  @Field(() => Int)
  @IsInt()
  projectId: number;

  @Field()
  @IsEmail()
  email: string;

  @Field(() => ProjectRole)
  @IsEnum(ProjectRole)
  role: ProjectRole;
}
