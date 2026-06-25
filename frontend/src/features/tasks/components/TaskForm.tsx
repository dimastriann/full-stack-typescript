import { useEffect, useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useParams } from 'react-router-dom';
import { GET_TASK, GET_TASK_STAGES } from '../gql/task.graphql';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import CustomFieldsFormSection from '../../workspaces/components/CustomFieldsFormSection';
import { UPSERT_CUSTOM_FIELD_VALUE } from '../../workspaces/gql/custom-field.graphql';
import type { ProjectType } from '../../../types/Projects';
import { GET_USERS } from '../../users/gql/user.graphql';
import { useForm, Controller } from 'react-hook-form';
import Logger from '../../../lib/logger';
import Select from '../../../components/Select';
import { X, FileText, AlertCircle, Briefcase, User } from 'lucide-react';
import { TaskPriority, TaskTypeEnum } from '../../../types/Tasks';
import type { TaskStage, TaskType } from '../../../types/Tasks';
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
  const [hasResetInitial, setHasResetInitial] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<number, string>
  >({});
  const [customFieldsValid, setCustomFieldsValid] = useState(true);

  const [upsertCustomFieldValue] = useMutation(UPSERT_CUSTOM_FIELD_VALUE);

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
    control,
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
    } else if (!isEditMode && userId && users.length && !hasResetInitial) {
      reset({
        title: '',
        description: '',
        userId: userId.toString(),
        projectId: '',
        stageId: '',
      });
      setHasResetInitial(true);
    }
  }, [task, isEditMode, reset, userId, users, projects, hasResetInitial]);

  const onSubmit = handleSubmit(async (formData) => {
    if (!customFieldsValid) return;

    try {
      const input: Partial<TaskType> & {
        id?: number;
      } = {
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

      let savedId: number;

      if (isEditMode) {
        savedId = Number(taskId);
        input.id = savedId;
        await updateRecord({ variables: { input } });
      } else {
        const res = await createRecord({ variables: { input } });
        savedId = res.data.createTask.id;
      }

      // Upsert custom field values
      await Promise.all(
        Object.entries(customFieldValues).map(([fieldId, value]) =>
          upsertCustomFieldValue({
            variables: {
              input: {
                fieldId: parseInt(fieldId, 10),
                entityId: savedId,
                value,
              },
            },
          }),
        ),
      );

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
    return (
      <p className="p-4 text-red-600 dark:text-red-400 font-medium text-center">
        Task not found
      </p>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl animate-slide-in-up transition-colors">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-red-700 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Section: General ── */}
      <div className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 p-6 rounded-2xl space-y-5 transition-colors">
        <div className="form-section-title text-gray-900 dark:text-white">
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
            <span className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 block px-1 animate-slide-in-up">
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
      <div className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 p-6 rounded-2xl space-y-5 transition-colors">
        <div className="form-section-title text-gray-900 dark:text-white">
          <Briefcase size={16} className="text-primary-500" />
          Classification & Hierarchy
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="projectId" className="label-modern">
              Project
            </label>
            <Controller
              name="projectId"
              control={control}
              rules={{ required: 'Project is required' }}
              render={({ field }) => (
                <Select
                  id="projectId"
                  value={field.value}
                  onChange={field.onChange}
                  options={projects.map((p) => ({
                    id: p.id?.toString() || '',
                    label: p.name,
                  }))}
                  placeholder="Select Project"
                  error={!!errors.projectId}
                />
              )}
            />
            {errors.projectId && (
              <span className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 block px-1 animate-slide-in-up">
                {errors.projectId.message}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="parentTaskId" className="label-modern">
              Parent Task
            </label>
            <Controller
              name="parentTaskId"
              control={control}
              render={({ field }) => (
                <Select
                  id="parentTaskId"
                  value={field.value}
                  onChange={field.onChange}
                  options={
                    data?.tasks
                      ?.filter((t: TaskType) => t.id !== Number(taskId))
                      .map((t: TaskType) => ({
                        id: t.id?.toString() || '',
                        label: t.title,
                      })) || []
                  }
                  placeholder="No Parent (Root Task)"
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="label-modern">
              Task Type
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  id="type"
                  value={field.value}
                  onChange={field.onChange}
                  options={Object.values(TaskTypeEnum).map((t) => ({
                    id: t,
                    label: t,
                  }))}
                />
              )}
            />
          </div>

          <div>
            <label htmlFor="priority" className="label-modern">
              Priority
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  id="priority"
                  value={field.value}
                  onChange={field.onChange}
                  options={Object.values(TaskPriority).map((p) => ({
                    id: p,
                    label: p,
                  }))}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* ── Section: Assignment & Scheduling ── */}
      <div className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 p-6 rounded-2xl space-y-5 transition-colors">
        <div className="form-section-title text-gray-900 dark:text-white">
          <User size={16} className="text-primary-500" />
          Assignment & Scheduling
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="userId" className="label-modern">
              Assigned User
            </label>
            <Controller
              name="userId"
              control={control}
              rules={{ required: 'User is required' }}
              render={({ field }) => (
                <Select
                  id="userId"
                  value={field.value}
                  onChange={field.onChange}
                  options={users.map((u) => ({
                    id: u.id?.toString() || '',
                    label: u.name,
                  }))}
                  placeholder="Select User"
                  error={!!errors.userId}
                />
              )}
            />

            {errors.userId && (
              <span className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 block px-1 animate-slide-in-up">
                {errors.userId.message?.toString()}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="stageId" className="label-modern">
              Stage
            </label>
            <Controller
              name="stageId"
              control={control}
              render={({ field }) => (
                <Select
                  id="stageId"
                  value={field.value}
                  onChange={field.onChange}
                  options={stages.map((s) => ({
                    id: s.id.toString(),
                    label: s.title,
                  }))}
                  placeholder="Select Stage"
                />
              )}
            />
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

      {/* ── Section: Custom Fields ── */}
      {activeWorkspace && (
        <CustomFieldsFormSection
          workspaceId={activeWorkspace.id}
          entityType="TASK"
          entityId={isEditMode ? Number(taskId) : undefined}
          onValuesChange={(values, isValid) => {
            setCustomFieldValues(values);
            setCustomFieldsValid(isValid);
          }}
        />
      )}

      {/* ── Section: Actions ── */}
      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-surface-200 dark:border-slate-800 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-surface-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={mutationLoading || !customFieldsValid}
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
