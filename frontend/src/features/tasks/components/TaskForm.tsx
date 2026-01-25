import { useEffect, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useParams } from 'react-router-dom';
import { GET_TASK, GET_TASK_STAGES } from '../gql/task.graphql';
import { useQuery } from '@apollo/client';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import type { ProjectType } from '../../../types/Projects';
import { GET_USERS } from '../../users/gql/user.graphql';
import { useForm } from 'react-hook-form';
import Logger from '../../../lib/logger';
import { X } from 'lucide-react';
import type { TaskStage } from '../../../types/Tasks';
import TaskTimesheetTable from './TaskTimesheetTable';
import { useAuth } from '../../../context/AuthProvider';
import { useWorkspace } from '../../../context/WorkspaceProvider';
import type { UserType } from '../../../types/Users';

interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaskForm({ onSuccess, onCancel }: TaskFormProps) {
  const { user: currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { taskId } = useParams();

  const isEditMode = !!taskId;

  const { data, loading: queryLoading } = useQuery(GET_TASK, {
    skip: !isEditMode,
    variables: { id: parseInt(taskId || '0') },
  });
  const { data: usersData } = useQuery(GET_USERS);
  const { data: projectsData } = useQuery(GET_PROJECTS, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });
  const { data: stagesData } = useQuery(GET_TASK_STAGES, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });

  const {
    createRecord,
    updateRecord,
    refetch,
    loading: mutationLoading,
  } = useTasks();
  const [errorMsg, setErrorMsg] = useState<string>('');

  const task = data?.getTask;
  const projects: ProjectType[] = projectsData?.projects ?? [];
  const users: UserType[] = usersData?.users ?? [];
  const stages: TaskStage[] = stagesData?.taskStages ?? [];
  const userId = currentUser?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      userId: userId?.toString() || '',
      projectId: '',
      stageId: '',
    },
  });

  useEffect(() => {
    if (isEditMode && task && projects.length) {
      reset({
        title: task.title,
        description: task.description,
        userId: task.userId.toString(),
        projectId: task.projectId.toString(),
        stageId: task.stageId?.toString() || '',
      });
    } else if (!isEditMode && userId && users.length) {
      reset({
        title: '',
        description: '',
        userId: userId.toString(),
        projectId: '',
        stageId: '',
      });
    }
  }, [task, isEditMode, reset, userId, users, projects]);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const input: any = {
        title: formData.title,
        description: formData.description,
        userId: Number(formData.userId),
        projectId: Number(formData.projectId),
      };

      if (formData.stageId) {
        input.stageId = Number(formData.stageId);
      }

      if (isEditMode) {
        input.id = Number(taskId);
        await updateRecord({ variables: { input } });
      } else {
        await createRecord({ variables: { input } });
      }

      if (onSuccess) onSuccess();
      await refetch();
    } catch (err) {
      Logger.error(err as string);
      setErrorMsg(`${err}`);
    }
  });

  if (queryLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  if (!data?.getTask && taskId && !queryLoading)
    return <p className="p-4 text-red-600">Task not found</p>;

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">
            Task Details
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              placeholder="Task Title"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
            {errors.title && (
              <span className="text-red-500 text-xs">
                {errors.title.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Task Description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Assigned User
              </label>
              <select
                {...register('userId', { required: 'User is required' })}
                disabled={currentUser?.role === 'USER'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select User</option>
                {users?.map((u: UserType) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              {errors.userId && (
                <span className="text-red-500 text-xs">
                  {errors.userId.message?.toString()}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <select
                {...register('projectId', { required: 'Project is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
              >
                <option value="">Select Project</option>
                {projects?.map((p: ProjectType) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <span className="text-red-500 text-xs">
                  {errors.projectId.message}
                </span>
              )}
            </div>

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

      {isEditMode && task && (
        <div className="space-y-4 mt-6">
          <TaskTimesheetTable
            taskId={task.id}
            userId={task.userId}
            projectId={task.projectId}
          />
        </div>
      )}
    </div>
  );
}
