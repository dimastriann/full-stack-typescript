import { useEffect, useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useParams } from 'react-router-dom';
import { GET_TASK, GET_TASK_STAGES } from '../gql/task.graphql';
import { useQuery } from '@apollo/client';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import type { ProjectType } from '../../../types/Projects';
import { GET_USERS } from '../../users/gql/user.graphql';
import { useForm } from 'react-hook-form';
import Logger from '../../../lib/logger';
import { X, FileText, AlertCircle, Briefcase, User } from 'lucide-react';
import { TaskPriority, TaskTypeEnum } from '../../../types/Tasks';
import type { TaskStage } from '../../../types/Tasks';
import { useAuthStore } from '../../../store/authStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import type { UserType } from '../../../types/Users';

interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaskForm({ onSuccess, onCancel }: TaskFormProps) {
  const currentUser = useAuthStore((state) => state.user);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
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
  const projects = useMemo<ProjectType[]>(
    () => projectsData?.projects ?? [],
    [projectsData?.projects],
  );
  const users = useMemo<UserType[]>(
    () => usersData?.users ?? [],
    [usersData?.users],
  );
  const stages = useMemo<TaskStage[]>(
    () => stagesData?.taskStages ?? [],
    [stagesData?.taskStages],
  );
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
      estimatedHours: 0,
      dueDate: '',
      priority: TaskPriority.MEDIUM,
      type: TaskTypeEnum.TASK,
      parentTaskId: '',
      startDate: '',
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
        estimatedHours: task.estimatedHours,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : '',
        priority: task.priority,
        type: task.type,
        parentTaskId: task.parentTaskId?.toString() || '',
        startDate: task.startDate
          ? new Date(task.startDate).toISOString().split('T')[0]
          : '',
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
        estimatedHours: Number(formData.estimatedHours),
        priority: formData.priority,
        type: formData.type,
        parentTaskId: formData.parentTaskId
          ? Number(formData.parentTaskId)
          : undefined,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : undefined,
      };

      if (formData.dueDate) {
        input.dueDate = formData.dueDate;
      }

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  if (!data?.getTask && taskId && !queryLoading)
    return <p className="p-4 text-red-600">Task not found</p>;

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
          <label htmlFor="title" className="label-modern">
            Task Title
          </label>
          <input
            id="title"
            {...register('title', { required: 'Title is required' })}
            placeholder="What needs to be done?"
            className="input-modern"
          />
          {errors.title && (
            <span className="text-red-500 text-xs mt-1 block">
              {errors.title.message}
            </span>
          )}
        </div>

        <div>
          <label className="label-modern">Description</label>
          <textarea
            {...register('description')}
            placeholder="Add more details about this task..."
            rows={3}
            className="input-modern resize-none"
          />
        </div>
      </div>

      {/* ── Section: Classification ── */}
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
          <Briefcase size={16} className="text-primary-500" />
          Classification & Hierarchy
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="projectId" className="label-modern">
              Project
            </label>
            <select
              id="projectId"
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
            <label htmlFor="parentTaskId" className="label-modern">
              Parent Task
            </label>
            <select
              id="parentTaskId"
              {...register('parentTaskId')}
              className="select-modern"
            >
              <option value="">No Parent (Root Task)</option>
              {/* Ideally filter to only show tasks from same project */}
              {data?.tasks
                ?.filter((t: any) => t.id !== Number(taskId))
                .map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="label-modern">
              Task Type
            </label>
            <select id="type" {...register('type')} className="select-modern">
              {Object.values(TaskTypeEnum).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="label-modern">
              Priority
            </label>
            <select
              id="priority"
              {...register('priority')}
              className="select-modern"
            >
              {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section: Assignment & Scheduling ── */}
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
          <User size={16} className="text-primary-500" />
          Assignment & Scheduling
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="userId" className="label-modern">
              Assigned User
            </label>
            <select
              id="userId"
              {...register('userId', { required: 'User is required' })}
              disabled={currentUser?.role === 'USER'}
              className="select-modern disabled:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select User</option>
              {users?.map((u: UserType) => (
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
            <label htmlFor="stageId" className="label-modern">
              Stage
            </label>
            <select
              id="stageId"
              {...register('stageId')}
              className="select-modern"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="label-modern">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              {...register('startDate')}
              className="input-modern"
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="label-modern">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              {...register('dueDate')}
              className="input-modern"
            />
          </div>

          <div>
            <label htmlFor="estimatedHours" className="label-modern">
              Est. Hours
            </label>
            <input
              id="estimatedHours"
              type="number"
              step="0.5"
              {...register('estimatedHours')}
              placeholder="0"
              className="input-modern"
            />
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
              ? 'Update Task'
              : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
