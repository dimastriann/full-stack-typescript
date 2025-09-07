declare const enum ProjectStatus {
  DRAFT,
  IN_PROGRESS,
  IN_REVIEW,
  DONE,
  CANCELED,
}

export type ProjectType = {
  id?: number;
  name: string;
  description: string;
  status: ProjectStatus.DRAFT;
  responsibleId: number;
};
