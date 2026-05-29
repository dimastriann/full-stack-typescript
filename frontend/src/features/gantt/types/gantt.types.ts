export interface GanttTask {
  id: number;
  title: string;
  priority: string;
  progress: number;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  estimatedHours: number;
  type: string;
  stage?: {
    id: number;
    title: string;
    color: string;
    isCompleted: boolean;
  } | null;
  user: {
    id: number;
    name: string;
    firstName: string;
  };
  project: {
    id: number;
    name: string;
  };
  parentTaskId?: number | null;
}

export interface GanttProject {
  id: number;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  progress: number;
  stage?: {
    id: number;
    title: string;
    color: string;
  } | null;
}

export type GanttZoom = 'day' | 'week' | 'month';
