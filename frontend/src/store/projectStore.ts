import { create } from 'zustand';
import type { ProjectType } from '../types/Projects';

export interface ProjectState {
  projects: ProjectType[];
  editingProject: ProjectType | null;
  page: number;
  pageSize: number;
  setProjects: (projects: ProjectType[]) => void;
  setEditingProject: (project: ProjectType | null) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  editingProject: null,
  page: 0,
  pageSize: 20,
  setProjects: (projects) => set({ projects }),
  setEditingProject: (project) => set({ editingProject: project }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
}));
