import { InputType, Field, PartialType, Int } from '@nestjs/graphql';
import { CreateProjectStageInput } from './create-project-stage.input';

@InputType()
export class UpdateProjectStageInput extends PartialType(CreateProjectStageInput) {
    @Field(() => Int)
    id: number;
}
