import { CreateProjectInput } from './create-project.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateProjectInput extends PartialType(CreateProjectInput) {
  @Field(() => Int)
  id: number;

  @Field(() => Date, { nullable: true })
  actualStartDate?: Date;

  @Field(() => Date, { nullable: true })
  actualEndDate?: Date;

  @Field(() => Number, { nullable: true })
  progress?: number;

  @Field(() => Date, { nullable: true })
  archivedAt?: Date;

  @Field(() => String, { nullable: true })
  key?: string;
}
