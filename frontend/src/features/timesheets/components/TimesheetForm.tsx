import { useEffect, useMemo, useState } from 'react';
import { useTimesheets } from '../hooks/useTimesheets';
import { useParams } from 'react-router-dom';
import { GET_TIMESHEET } from '../gql/timesheet.graphql';
import { useQuery } from '@apollo/client';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import type { ProjectType } from '../../../types/Projects';
import { GET_USERS } from '../../users/gql/user.graphql';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useAuth } from '../../../context/AuthProvider';
import type { UserType } from '../../../types/Users';
import { GET_TASKS } from '../../tasks/gql/task.graphql';
import type { TaskType } from '../../../types/Tasks';


interface TimesheetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TimesheetForm({
  onSuccess,
  onCancel,
}: TimesheetFormProps) {
  const { user: currentUser } = useAuth();
  const { timesheetId } = useParams();

  const isEditMode = !!timesheetId;

  const { data, loading: queryLoading } = useQuery(GET_TIMESHEET, {
    skip: !isEditMode,
    variables: { id: parseInt(timesheetId || '0') },
  });
  const { data: usersData } = useQuery(GET_USERS);
  const { data: projectsData } = useQuery(GET_PROJECTS);
  const { data: tasksData } = useQuery(GET_TASKS);
  const {
    createRecord,
    updateRecord,
    refetch,
    loading: mutationLoading,
  } = useTimesheets();
  const [errorMsg, setErrorMsg] = useState<string>('');

  const timesheet = data?.getTimesheet;
  const projects: ProjectType[] = projectsData?.projects;
  const tasks: TaskType[] = tasksData?.tasks;
  const users: UserType[] = usersData?.users;
  const userId = currentUser?.id;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      description: '',
      date: new Date().toISOString().split('T')[0],
      timeSpent: 0,
      userId: userId?.toString() || '',
      projectId: '',
      taskId: '',
    },

  });

  const projectId = Number(watch('projectId'));
  const projectTasks = useMemo(() => {
    return tasks?.filter((task) => task.project.id === projectId);
  }, [projectId, tasks]);

  console.log('timesheet', timesheet);

  useEffect(() => {
    if (isEditMode && timesheet && tasks) {
      reset({
        description: timesheet.description,
        date: new Date(timesheet.date).toISOString().split('T')[0],
        timeSpent: timesheet.timeSpent,
        userId: timesheet.userId.toString(),
        projectId: timesheet.projectId.toString(),
        taskId: timesheet.taskId?.toString(),
      });
    } else if (!isEditMode && userId && users) {
      reset({
        userId: userId.toString(),
      });
    }
  }, [timesheet, isEditMode, reset, userId, users, tasks]);



  const onSubmit = handleSubmit(async (formData) => {
    try {
      const input = {
        ...formData,
        id: isEditMode ? Number(timesheetId) : undefined,
        timeSpent: Number(formData.timeSpent),
        userId: Number(formData.userId),
        projectId: Number(formData.projectId),
        taskId: formData.taskId ? Number(formData.taskId) : undefined,
        date: new Date(formData.date).toISOString(),
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
  if (!data?.getTimesheet && timesheetId && !queryLoading)
    return <p className="p-4 text-red-600">Timesheet not found</p>;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white shadow-md"
    >
      <h2 className="text-xl font-semibold">
        {isEditMode ? 'Edit Timesheet' : 'Create Timesheet'}
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          placeholder="Description"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
        />
        {errors.description && (
          <span className="text-red-500 text-xs">
            {errors.description.message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          />
          {errors.date && (
            <span className="text-red-500 text-xs">{errors.date.message}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Time Spent (Hours)
          </label>
          <input
            type="number"
            step="0.1"
            {...register('timeSpent', {
              required: 'Time spent is required',
              min: 0,
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          />
          {errors.timeSpent && (
            <span className="text-red-500 text-xs">
              {errors.timeSpent.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            User
          </label>
          <select
            {...register('userId', { required: 'User is required' })}
            disabled={currentUser?.role === 'USER'}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select User</option>
            {users?.map((u: any) => (
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
            Task
          </label>
          <select
            {...register('taskId', { required: 'Task is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          >
            <option value="">Select Task</option>
            {projectTasks?.map((t: TaskType) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          {errors.taskId && (
            <span className="text-red-500 text-xs">
              {errors.taskId.message}
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
    </form>
  );
}
