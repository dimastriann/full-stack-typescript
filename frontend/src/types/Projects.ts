export enum ProjectStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export enum ProjectRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

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
  status: ProjectStatus;
  responsibleId: number;
  responsible?: {
    id: number;
    name: string;
  };
  members?: ProjectMember[];
};
