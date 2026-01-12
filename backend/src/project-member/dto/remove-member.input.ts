import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt } from 'class-validator';

/**
 * Input for removing a member from a project
 */
@InputType()
export class RemoveMemberInput {
  @Field(() => Int)
  @IsInt()
  projectId: number;

  @Field(() => Int)
  @IsInt()
  userId: number;
}
