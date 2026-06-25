export enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
}

export interface CustomFieldDefinition {
  id: number;
  workspaceId: number;
  entityType: 'TASK' | 'PROJECT';
  name: string;
  type: CustomFieldType;
  options: string[];
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldValue {
  id: number;
  fieldId: number;
  entityId: number;
  value: string;
  field: CustomFieldDefinition;
  createdAt: string;
  updatedAt: string;
}
