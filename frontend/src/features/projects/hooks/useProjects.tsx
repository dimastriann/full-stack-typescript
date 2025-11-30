import { useQuery, useMutation } from '@apollo/client';
import {
  CREATE_PROJECT,
  DELETE_PROJECT,
  UPDATE_PROJECT,
  GET_PROJECTS,
} from '../gql/project.graphql';
import type { ProjectType } from '../../../types/Projects';
import { createContext, useState, useEffect, useContext } from 'react';
import type { ProjectStoreModel } from '../../../types/BaseStore';

export const ProjectContext = createContext<ProjectStoreModel | undefined>(
  undefined,
);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const { data, loading, error, refetch } = useQuery(GET_PROJECTS, {
    variables: { skip: page * pageSize, take: pageSize },
  });
  const [createProject] = useMutation(CREATE_PROJECT);
  const [updateProject] = useMutation(UPDATE_PROJECT);
  const [deleteProject] = useMutation(DELETE_PROJECT);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(
    null,
  );
  const [projects, setProjects] = useState<ProjectType[]>([]);

  useEffect(() => {
    if (data) {
      setProjects(data?.projects || []);
    }
  }, [data]);

  const projectStore = {
    records: projects,
    loading,
    error,
    refetch,
    editingRecord: editingProject,
    setEditingRecord: setEditingProject,
    createRecord: createProject,
    updateRecord: updateProject,
    deleteRecord: deleteProject,
    page,
    setPage,
    pageSize,
    setPageSize,
  };

  return (
    <ProjectContext.Provider value={projectStore}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
