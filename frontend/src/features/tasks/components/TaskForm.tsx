// features/tasks/components/TaskForm.tsx
import { useEffect, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useParams } from 'react-router-dom';
import { GET_TASK } from '../gql/task.graphql';
import { useQuery } from '@apollo/client';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import type { ProjectType } from '../../../types/Projects';
import { GET_USERS } from '../../users/gql/user.graphql';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { TaskStatus } from '../../../types/Tasks';

interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaskForm({ onSuccess, onCancel }: TaskFormProps) {
  const { taskId } = useParams();
  const isEditMode = !!taskId;

  // Only fetch if we are in edit mode (have a userId from params)
  const { data, loading: queryLoading } = useQuery(GET_TASK, {
    skip: !isEditMode,
    variables: { id: parseInt(taskId || '0') },
  });
  const { data: usersData } = useQuery(GET_USERS);
  const { data: projectsData } = useQuery(GET_PROJECTS);
  const {
    createRecord,
    updateRecord,
    refetch,
    loading: mutationLoading,
  } = useTasks();
  const [errorMsg, setErrorMsg] = useState<string>('');

  const task = data?.getTask;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      userId: '',
      projectId: '',
      status: TaskStatus.TODO,
    },
  });

  useEffect(() => {
    if (isEditMode && task) {
      console.log('task edit', task);
      reset({
        title: task.title,
        description: task.description,
        userId: task.userId,
        projectId: task.projectId,
        status: task.status,
      });
    }
  }, [task, isEditMode, reset]);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const input = {
        ...formData,
        id: isEditMode ? Number(taskId) : undefined,
        userId: Number(formData.userId),
        projectId: Number(formData.projectId),
      };

      if (isEditMode) {
        await updateRecord({ variables: { input } });
      } else {
        await createRecord({ variables: { input } });
      }
      refetch();
      if (onSuccess) onSuccess();
      reset();
    } catch (err) {
      console.error(err);
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
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          {...register('title', { required: 'Title is required' })}
          placeholder="Task Title"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
        />
        {errors.title && (
          <span className="text-red-500 text-xs">{errors.title.message}</span>
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          >
            <option value="">Select User</option>
            {usersData?.users?.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {errors.userId && (
            <span className="text-red-500 text-xs">
              {errors.userId.message}
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
            {projectsData?.projects?.map((p: ProjectType) => (
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
            Status
          </label>
          <select
            {...register('status')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          >
            <option value={TaskStatus.TODO}>To Do</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.DEPLOYED}>Deployed</option>
            <option value={TaskStatus.TESTING}>Testing</option>
            <option value={TaskStatus.REVISION}>Revision</option>
            <option value={TaskStatus.DONE}>Done</option>
            <option value={TaskStatus.CANCELED}>Canceled</option>
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
    </form>
  );
}
