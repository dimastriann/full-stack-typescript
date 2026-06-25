import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { CustomFieldType } from 'prisma/generated/enums';

// Re-export so other modules can import from a single location
export { CustomFieldType };

registerEnumType(CustomFieldType, {
  name: 'CustomFieldType',
  description: 'Supported custom field data types',
});

@ObjectType()
export class CustomFieldDefinition {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  workspaceId: number;

  /** Target entity this field applies to: "TASK" | "PROJECT" */
  @Field()
  entityType: string;

  @Field()
  name: string;

  @Field(() => CustomFieldType)
  type: CustomFieldType;

  /** Available options for SELECT type fields. */
  @Field(() => [String])
  options: string[];

  @Field()
  isRequired: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class CustomFieldValue {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  fieldId: number;

  @Field(() => Int)
  entityId: number;

  /** Stored as string; consumers cast to the appropriate type using fieldType. */
  @Field()
  value: string;

  @Field(() => CustomFieldDefinition)
  field: CustomFieldDefinition;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
