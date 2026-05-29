import { CreateProjectInput } from './create-project.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateProjectInput extends PartialType(CreateProjectInput) {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  actualStartDate?: Date;

  @Field({ nullable: true })
  actualEndDate?: Date;

  @Field(() => Number, { nullable: true })
  progress?: number;

  @Field({ nullable: true })
  archivedAt?: Date;

  @Field({ nullable: true })
  key?: string;
}
