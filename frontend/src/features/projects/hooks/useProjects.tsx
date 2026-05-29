import { useQuery, useMutation } from '@apollo/client';
import {
  CREATE_PROJECT,
  DELETE_PROJECT,
  UPDATE_PROJECT,
  GET_PROJECTS,
} from '../gql/project.graphql';
import { useEffect } from 'react';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useProjectStore } from '../../../store/projectStore';

export const useProjects = () => {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const {
    projects,
    setProjects,
    editingProject,
    setEditingProject,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useProjectStore();

  const { data, loading, error, refetch } = useQuery(GET_PROJECTS, {
    variables: {
      skip: page * pageSize,
      take: pageSize,
      workspaceId: activeWorkspace?.id,
    },
    skip: !activeWorkspace,
  });

  const [createProject] = useMutation(CREATE_PROJECT);
  const [updateProject] = useMutation(UPDATE_PROJECT);
  const [deleteProject] = useMutation(DELETE_PROJECT);

  useEffect(() => {
    if (data?.projects) {
      setProjects(data.projects);
    }
  }, [data, setProjects]);

  return {
    records: projects,
    loading,
    error,
    refetch,
    editingRecord: editingProject,
    setEditingRecord: setEditingProject,
    createRecord: createProject,
    updateRecord: updateProject,
    deleteRecord: deleteProject,
    setRecords: setProjects,
    page,
    setPage,
    pageSize,
    setPageSize,
  };
};
