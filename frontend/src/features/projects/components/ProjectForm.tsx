import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PROJECTS, GET_PROJECT_STAGES } from '../gql/project.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';
import type { ProjectType, ProjectStage } from '../../../types/Projects';
import ProjectTaskTable from './ProjectTaskTable';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../../../context/AuthProvider';
import { useWorkspace } from '../../../context/WorkspaceProvider';
import type { UserType } from '../../../types/Users';

interface ProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const { user: currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const defaultValues = {
    name: '',
    description: '',
    stageId: '',
    responsibleId: '',
  };

  const { projectId } = useParams();
  const isEditMode = !!projectId;

  // Fetch project data if in edit mode
  // Note: GET_PROJECTS returns all projects, we might want a GET_PROJECT query for single item
  // For now, we'll filter from GET_PROJECTS or use the one from context if available,
  // but standard way is to fetch single item.
  // Since we don't have GET_PROJECT yet, let's rely on the list or add GET_PROJECT later.
  // Actually, let's use the list from cache or fetch all.
  // Better: Let's assume we can find it in the list for now, or just use the list query.
  // Ideally we should add GET_PROJECT query.

  const { data: projectsData } = useQuery(GET_PROJECTS, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });

  const { data: usersData } = useQuery(GET_USERS);
  const { data: stagesData } = useQuery(GET_PROJECT_STAGES, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });

  const {
    createRecord,
    updateRecord,
    refetch,
    loading: mutationLoading,
  } = useProjects();
  const [errorMsg, setErrorMsg] = useState<string>('');

  const userId = currentUser?.id?.toString();
  const users: UserType[] = usersData?.users ?? [];
  const projects: ProjectType[] = projectsData?.projects ?? [];
  const stages: ProjectStage[] = stagesData?.projectStages ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (isEditMode && projects.length) {
      const project = projects.find(
        (p: ProjectType) => p.id === parseInt(projectId),
      );
      if (project) {
        reset({
          name: project.name,
          description: project.description,
          stageId: project.stageId?.toString() || '',
          responsibleId: project.responsibleId.toString(),
        });
      }
    } else if (!isEditMode && userId && users.length) {
      reset({
        ...defaultValues,
        responsibleId: userId,
      });
    }
  }, [projects, projectId, isEditMode, reset, userId, users]);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (!activeWorkspace) throw new Error('No active workspace selected');

      const projectFormData: any = {
        ...formData,
        workspaceId: activeWorkspace.id,
      };

      // Convert IDs to number
      if (projectFormData.responsibleId) {
        projectFormData.responsibleId = parseInt(projectFormData.responsibleId);
      }
      if (projectFormData.stageId) {
        projectFormData.stageId = parseInt(projectFormData.stageId);
      } else {
        delete projectFormData.stageId;
      }

      if (isEditMode) {
        if ('__typename' in projectFormData) delete projectFormData.__typename;

        // Ensure id is present
        projectFormData.id = parseInt(projectId!);
        await updateRecord({
          variables: {
            updateProjectInput: projectFormData,
          },
        });
      } else {
        await createRecord({
          variables: { createProjectInput: projectFormData },
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        await refetch();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(`${err}`);
    }
  });

  const project = projects.find(
    (p: ProjectType) => p.id === parseInt(projectId || '0'),
  );

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">
            Project Details
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              {...register('name', { required: 'Project Name is required' })}
              placeholder="Project Name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
            {errors.name && (
              <span className="text-red-500 text-xs">
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Project Description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stage
              </label>
              <select
                {...register('stageId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
              >
                <option value="">Select Stage</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Responsible Person
              </label>
              <select
                {...register('responsibleId', {
                  required: 'Responsible person is required',
                })}
                disabled={currentUser?.role === 'USER'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select User</option>
                {users.map((u: UserType) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              {errors.responsibleId && (
                <span className="text-red-500 text-xs">
                  {errors.responsibleId.message?.toString()}
                </span>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="border-red-600 border-[1px] rounded-md my-2 p-2 text-red-600 bg-red-100 relative">
              {errorMsg}
              <X
                className="cursor-pointer text-black absolute top-1 right-1 size-5"
                onClick={() => setErrorMsg('')}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={mutationLoading}
              className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {mutationLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </form>

      {isEditMode && project && (
        <div className="space-y-4 mt-6">
          <ProjectTaskTable projectId={project.id} />
        </div>
      )}
    </div>
  );
}
