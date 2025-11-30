export enum ProjectStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

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
};
