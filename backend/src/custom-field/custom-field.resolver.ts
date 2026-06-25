import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { CustomFieldService } from './custom-field.service';
import {
  CustomFieldDefinition,
  CustomFieldValue,
} from './entities/custom-field.entity';
import {
  CreateCustomFieldDefinitionInput,
  UpdateCustomFieldDefinitionInput,
  UpsertCustomFieldValueInput,
} from './dto/custom-field.input';

@Resolver()
@UseGuards(GqlAuthGuard)
export class CustomFieldResolver {
  constructor(private readonly customFieldService: CustomFieldService) {}

  // ── Definitions ────────────────────────────────────────────────────────────

  @Query(() => [CustomFieldDefinition], { name: 'customFieldDefinitions' })
  listDefinitions(
    @CurrentUser() user: User,
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('entityType', { type: () => String, nullable: true })
    entityType?: string,
  ) {
    return this.customFieldService.listDefinitions(
      workspaceId,
      user.id,
      entityType,
    );
  }

  @Mutation(() => CustomFieldDefinition, {
    name: 'createCustomFieldDefinition',
  })
  createDefinition(
    @CurrentUser() user: User,
    @Args('input') input: CreateCustomFieldDefinitionInput,
  ) {
    return this.customFieldService.createDefinition(input, user.id);
  }

  @Mutation(() => CustomFieldDefinition, {
    name: 'updateCustomFieldDefinition',
  })
  updateDefinition(
    @CurrentUser() user: User,
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateCustomFieldDefinitionInput,
  ) {
    return this.customFieldService.updateDefinition(id, input, user.id);
  }

  @Mutation(() => CustomFieldDefinition, {
    name: 'deleteCustomFieldDefinition',
  })
  deleteDefinition(
    @CurrentUser() user: User,
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.customFieldService.deleteDefinition(id, user.id);
  }

  // ── Values ─────────────────────────────────────────────────────────────────

  @Query(() => [CustomFieldValue], { name: 'customFieldValues' })
  getValues(
    @CurrentUser() user: User,
    @Args('entityId', { type: () => Int }) entityId: number,
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
  ) {
    return this.customFieldService.getValuesForEntity(
      entityId,
      workspaceId,
      user.id,
    );
  }

  @Mutation(() => CustomFieldValue, { name: 'upsertCustomFieldValue' })
  upsertValue(
    @CurrentUser() user: User,
    @Args('input') input: UpsertCustomFieldValueInput,
  ) {
    return this.customFieldService.upsertValue(input, user.id);
  }

  @Mutation(() => CustomFieldValue, { name: 'deleteCustomFieldValue' })
  deleteValue(
    @CurrentUser() user: User,
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.customFieldService.deleteValue(id, user.id);
  }
}
