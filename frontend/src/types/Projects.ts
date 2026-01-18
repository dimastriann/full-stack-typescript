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

export type ProjectType = {
  id?: number;
  name: string;
  description: string;
  responsibleId: number;
  workspaceId: number;
  stageId?: number;
  sequence: number;
  responsible?: {
    id: number;
    name: string;
  };
  members?: ProjectMember[];
  stage?: ProjectStage;
};
