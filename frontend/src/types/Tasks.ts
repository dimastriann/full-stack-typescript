declare const enum TaskStatus {
  TODO,
  IN_PROGRESS,
  DEPLOYED,
  TESTING,
  REVISION,
  DONE,
  CANCELED,
}

export type TaskType = {
  name: string;
  title: string;
  description?: string;
  status: TaskStatus.TODO;
};
