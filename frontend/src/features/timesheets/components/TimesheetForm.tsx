import { useEffect, useMemo, useState } from 'react';
import Logger from '../../../lib/logger';
import { useTimesheets } from '../hooks/useTimesheets';
import { useParams } from 'react-router-dom';
import { GET_TIMESHEET } from '../gql/timesheet.graphql';
import { useQuery } from '@apollo/client';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import type { ProjectType } from '../../../types/Projects';
import { GET_USERS } from '../../users/gql/user.graphql';
import { useForm } from 'react-hook-form';
import {
  X,
  FileText,
  Clock,
  Briefcase,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
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
  const currentUser = useAuthStore((state) => state.user);
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
      startTime: '',
      endTime: '',
      billable: true,
      hourlyRate: 0,
    },
  });

  const projectId = Number(watch('projectId'));
  const projectTasks = useMemo(() => {
    return tasks?.filter((task) => task.project.id === projectId);
  }, [projectId, tasks]);

  useEffect(() => {
    if (isEditMode && timesheet && tasks) {
      reset({
        description: timesheet.description,
        date: new Date(timesheet.date).toISOString().split('T')[0],
        timeSpent: timesheet.timeSpent,
        userId: timesheet.userId.toString(),
        projectId: timesheet.projectId.toString(),
        taskId: timesheet.taskId?.toString(),
        startTime: timesheet.startTime
          ? new Date(timesheet.startTime).toISOString().slice(0, 16)
          : '',
        endTime: timesheet.endTime
          ? new Date(timesheet.endTime).toISOString().slice(0, 16)
          : '',
        billable: timesheet.billable,
        hourlyRate: timesheet.hourlyRate || 0,
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
        startTime: formData.startTime
          ? new Date(formData.startTime).toISOString()
          : undefined,
        endTime: formData.endTime
          ? new Date(formData.endTime).toISOString()
          : undefined,
        billable: formData.billable,
        hourlyRate: Number(formData.hourlyRate || 0),
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
      Logger.error(err as string);
      setErrorMsg(`${err}`);
    }
  });

  if (queryLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  if (!data?.getTimesheet && timesheetId && !queryLoading)
    return <p className="p-4 text-red-600">Timesheet not found</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl animate-slide-in-up">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-red-700">{errorMsg}</div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Section: General ── */}
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
          <FileText size={16} className="text-primary-500" />
          General Information
        </div>

        <div>
          <label htmlFor="description" className="label-modern">
            Description
          </label>
          <textarea
            id="description"
            {...register('description', {
              required: 'Description is required',
            })}
            placeholder="What did you work on?"
            rows={3}
            className="input-modern resize-none"
          />
          {errors.description && (
            <span className="text-red-500 text-xs mt-1 block">
              {errors.description.message}
            </span>
          )}
        </div>
      </div>

      {/* ── Section: Time Entry ── */}
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
          <Clock size={16} className="text-primary-500" />
          Time Entry
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="label-modern">
              Date
            </label>
            <input
              id="date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              className="input-modern"
            />
            {errors.date && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.date.message}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="timeSpent" className="label-modern">
              Time Spent (Hours)
            </label>
            <input
              id="timeSpent"
              type="number"
              step="0.1"
              {...register('timeSpent', {
                required: 'Time spent is required',
                min: 0,
              })}
              placeholder="0.0"
              className="input-modern"
            />
            {errors.timeSpent && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.timeSpent.message}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="label-modern">
              Start Time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              {...register('startTime')}
              className="input-modern"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="label-modern">
              End Time
            </label>
            <input
              id="endTime"
              type="datetime-local"
              {...register('endTime')}
              className="input-modern"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Billing ── */}
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
          <DollarSign size={16} className="text-primary-500" />
          Billing
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label htmlFor="hourlyRate" className="label-modern">
              Hourly Rate
            </label>
            <input
              id="hourlyRate"
              type="number"
              step="0.01"
              {...register('hourlyRate')}
              placeholder="0.00"
              className="input-modern"
            />
          </div>

          <div className="flex items-center pt-5">
            <input
              id="billable"
              type="checkbox"
              {...register('billable')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 rounded"
            />
            <label
              htmlFor="billable"
              className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"
            >
              This is a billable entry
            </label>
          </div>
        </div>
      </div>

      {/* ── Section: Assignment ── */}
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
          <Briefcase size={16} className="text-primary-500" />
          Assignment
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="userId_ts" className="label-modern">
              User
            </label>
            <select
              id="userId_ts"
              {...register('userId', { required: 'User is required' })}
              disabled={currentUser?.role === 'USER'}
              className="select-modern disabled:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select User</option>
              {users?.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            {errors.userId && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.userId.message?.toString()}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="projectId_ts" className="label-modern">
              Project
            </label>
            <select
              id="projectId_ts"
              {...register('projectId', { required: 'Project is required' })}
              className="select-modern"
            >
              <option value="">Select Project</option>
              {projects?.map((p: ProjectType) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.projectId.message}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="taskId_ts" className="label-modern">
              Task
            </label>
            <select
              id="taskId_ts"
              {...register('taskId', { required: 'Task is required' })}
              className="select-modern"
            >
              <option value="">Select Task</option>
              {projectTasks?.map((t: TaskType) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {errors.taskId && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.taskId.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-surface-200 text-sm font-medium text-gray-600 bg-white hover:bg-surface-50 hover:border-surface-300 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={mutationLoading}
          className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-sm hover:bg-primary-700 hover:shadow-md focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutationLoading
            ? 'Saving...'
            : isEditMode
              ? 'Update Timesheet'
              : 'Create Timesheet'}
        </button>
      </div>
    </form>
  );
}
