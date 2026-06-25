import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomFieldType } from 'prisma/generated/enums';
import {
  CreateCustomFieldDefinitionInput,
  UpdateCustomFieldDefinitionInput,
  UpsertCustomFieldValueInput,
} from './dto/custom-field.input';

/** Supported entity types for custom fields. */
const ALLOWED_ENTITY_TYPES = ['TASK', 'PROJECT'] as const;
type EntityType = (typeof ALLOWED_ENTITY_TYPES)[number];

function assertEntityType(raw: string): EntityType {
  if (!ALLOWED_ENTITY_TYPES.includes(raw as EntityType)) {
    throw new BadRequestException(
      `entityType must be one of: ${ALLOWED_ENTITY_TYPES.join(', ')}`,
    );
  }
  return raw as EntityType;
}

@Injectable()
export class CustomFieldService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  /** Assert caller is at least OWNER or ADMIN of the workspace. */
  private async assertWorkspaceAdmin(
    workspaceId: number,
    userId: number,
  ): Promise<void> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException(
        'Only workspace owners or admins can manage custom fields',
      );
    }
  }

  /** Assert caller is at least a member of the workspace. */
  private async assertWorkspaceMember(
    workspaceId: number,
    userId: number,
  ): Promise<void> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Field Definitions
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Create a new custom field definition for a workspace.
   * Only OWNER / ADMIN may create definitions.
   */
  async createDefinition(
    input: CreateCustomFieldDefinitionInput,
    userId: number,
  ) {
    assertEntityType(input.entityType);
    await this.assertWorkspaceAdmin(input.workspaceId, userId);

    if (input.type === CustomFieldType.SELECT) {
      if (!input.options || input.options.length === 0) {
        throw new BadRequestException(
          'SELECT fields must have at least one option',
        );
      }
    }

    return this.prisma.customFieldDefinition.create({
      data: {
        workspaceId: input.workspaceId,
        entityType: input.entityType,
        name: input.name,
        type: input.type,
        options: input.options ?? [],
        isRequired: input.isRequired ?? false,
      },
      include: { values: false },
    });
  }

  /**
   * Update an existing custom field definition.
   * Only OWNER / ADMIN of the field's workspace may update.
   */
  async updateDefinition(
    id: number,
    input: UpdateCustomFieldDefinitionInput,
    userId: number,
  ) {
    const existing = await this.prisma.customFieldDefinition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Custom field definition ${id} not found`);
    }

    await this.assertWorkspaceAdmin(existing.workspaceId, userId);

    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.options !== undefined && { options: input.options }),
        ...(input.isRequired !== undefined && { isRequired: input.isRequired }),
      },
    });
  }

  /**
   * Permanently delete a custom field definition and all its values.
   * Only OWNER / ADMIN of the field's workspace may delete.
   */
  async deleteDefinition(id: number, userId: number) {
    const existing = await this.prisma.customFieldDefinition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Custom field definition ${id} not found`);
    }

    await this.assertWorkspaceAdmin(existing.workspaceId, userId);

    return this.prisma.customFieldDefinition.delete({ where: { id } });
  }

  /**
   * List all custom field definitions for a workspace, optionally filtered
   * by entity type ("TASK" or "PROJECT").
   */
  async listDefinitions(
    workspaceId: number,
    userId: number,
    entityType?: string,
  ) {
    await this.assertWorkspaceMember(workspaceId, userId);
    if (entityType) assertEntityType(entityType);

    return this.prisma.customFieldDefinition.findMany({
      where: {
        workspaceId,
        ...(entityType && { entityType }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Field Values
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Upsert a custom field value for a given entity (task or project).
   * Any workspace member may set values.
   */
  async upsertValue(input: UpsertCustomFieldValueInput, userId: number) {
    const field = await this.prisma.customFieldDefinition.findUnique({
      where: { id: input.fieldId },
    });
    if (!field) {
      throw new NotFoundException(`Custom field ${input.fieldId} not found`);
    }

    await this.assertWorkspaceMember(field.workspaceId, userId);

    // Validate value against field type
    this.validateValue(field.type, input.value, field.options);

    return this.prisma.customFieldValue.upsert({
      where: {
        fieldId_entityId: { fieldId: input.fieldId, entityId: input.entityId },
      },
      create: {
        fieldId: input.fieldId,
        entityId: input.entityId,
        value: input.value,
      },
      update: { value: input.value },
      include: { field: true },
    });
  }

  /**
   * Delete a specific custom field value.
   */
  async deleteValue(id: number, userId: number) {
    const existing = await this.prisma.customFieldValue.findUnique({
      where: { id },
      include: { field: true },
    });
    if (!existing) {
      throw new NotFoundException(`Custom field value ${id} not found`);
    }

    await this.assertWorkspaceMember(existing.field.workspaceId, userId);

    return this.prisma.customFieldValue.delete({ where: { id } });
  }

  /**
   * Get all field values for a specific entity (task or project).
   */
  async getValuesForEntity(
    entityId: number,
    workspaceId: number,
    userId: number,
  ) {
    await this.assertWorkspaceMember(workspaceId, userId);

    return this.prisma.customFieldValue.findMany({
      where: { entityId },
      include: { field: true },
      orderBy: { field: { createdAt: 'asc' } },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Validation
  // ────────────────────────────────────────────────────────────────────────────

  private validateValue(
    type: CustomFieldType,
    value: string,
    options: string[],
  ): void {
    switch (type) {
      case CustomFieldType.NUMBER:
        if (isNaN(Number(value))) {
          throw new BadRequestException(
            `Value "${value}" is not a valid number`,
          );
        }
        break;

      case CustomFieldType.DATE:
        if (isNaN(Date.parse(value))) {
          throw new BadRequestException(
            `Value "${value}" is not a valid ISO date string`,
          );
        }
        break;

      case CustomFieldType.SELECT:
        if (!options.includes(value)) {
          throw new BadRequestException(
            `Value "${value}" is not a valid option. Allowed: ${options.join(', ')}`,
          );
        }
        break;

      case CustomFieldType.TEXT:
      default:
        // Any non-empty string is valid for TEXT
        if (!value.trim()) {
          throw new BadRequestException('Text field value cannot be empty');
        }
        break;
    }
  }
}
