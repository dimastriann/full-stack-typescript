import { InputType, Int, Field } from '@nestjs/graphql';
import {
  ProjectMethodology,
  ProjectVisibility,
  ProjectPriority,
} from '../../../prisma/generated/enums';
import { IsSanitizedString } from '../../common/decorators/sanitized-string.decorator';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsSanitizedString()
  name: string;

  @Field({ nullable: true })
  @IsSanitizedString()
  description?: string;

  @Field(() => Int)
  responsibleId: number;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int, { nullable: true })
  stageId?: number;

  @Field(() => Int, { nullable: true })
  sequence?: number;

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  budgetPlanned?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  phasesCount?: number;

  @Field(() => ProjectMethodology, {
    nullable: true,
    defaultValue: ProjectMethodology.KANBAN,
  })
  methodology?: ProjectMethodology;

  @Field(() => ProjectVisibility, {
    nullable: true,
    defaultValue: ProjectVisibility.TEAM,
  })
  visibility?: ProjectVisibility;

  @Field(() => ProjectPriority, {
    nullable: true,
    defaultValue: ProjectPriority.MEDIUM,
  })
  priority?: ProjectPriority;

  @Field({ nullable: true, defaultValue: 'USD' })
  currency?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
