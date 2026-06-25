import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CustomFieldType } from '../entities/custom-field.entity';

@InputType()
export class CreateCustomFieldDefinitionInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  workspaceId: number;

  /**
   * Target entity type: "TASK" or "PROJECT"
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => CustomFieldType)
  @IsEnum(CustomFieldType)
  type: CustomFieldType;

  /** Required for SELECT type — list of allowed option strings. */
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  options?: string[];

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  isRequired?: boolean;
}

@InputType()
export class UpdateCustomFieldDefinitionInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  options?: string[];

  @Field({ nullable: true })
  @IsOptional()
  isRequired?: boolean;
}

@InputType()
export class UpsertCustomFieldValueInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  fieldId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  entityId: number;

  @Field()
  @IsString()
  value: string;
}
