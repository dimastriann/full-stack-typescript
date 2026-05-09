export enum ProjectRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export type ProjectStage = {
  id: number;
  title: string;
  color: string;
  sequence: number;
  isCompleted: boolean;
  isCanceled: boolean;
};

export type ProjectMember = {
  id: number;
  userId: number;
  projectId: number;
  role: ProjectRole;
  joinedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export enum ProjectMethodology {
  SCRUM = 'SCRUM',
  WATERFALL = 'WATERFALL',
  KANBAN = 'KANBAN',
  AGILE = 'AGILE',
  OTHER = 'OTHER',
}

export enum ProjectVisibility {
  PRIVATE = 'PRIVATE',
  TEAM = 'TEAM',
  PUBLIC = 'PUBLIC',
}

export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export type ProjectType = {
  id?: number;
  name: string;
  description: string;
  responsibleId: number;
  workspaceId: number;
  stageId?: number;
  sequence: number;
  budgetPlanned: number;
  budgetActual: number;
  totalHours?: number;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  phasesCount: number;
  methodology: ProjectMethodology;
  key?: string;
  visibility: ProjectVisibility;
  priority: ProjectPriority;
  progress: number;
  currency: string;
  tags?: string[];
  archivedAt?: string;
  responsible?: {
    id: number;
    name: string;
  };
  members?: ProjectMember[];
  stage?: ProjectStage;
};
