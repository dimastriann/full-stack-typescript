import { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  Calendar,
  DollarSign,
  Settings2,
  AlertCircle,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import Logger from '../../../lib/logger';
import Select from '../../../components/Select';
import { GET_PROJECTS, GET_PROJECT_STAGES } from '../gql/project.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';
import {
  ProjectMethodology,
  ProjectVisibility,
  ProjectPriority,
} from '../../../types/Projects';
import type { ProjectType, ProjectStage } from '../../../types/Projects';
import { useProjects } from '../hooks/useProjects';
import { useAuthStore } from '../../../store/authStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import type { UserType } from '../../../types/Users';

interface ProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const defaultValues = {
  name: '',
  description: '',
  stageId: '',
  responsibleId: '',
  budgetPlanned: 0,
  startDate: '',
  endDate: '',
  phasesCount: 1,
  methodology: ProjectMethodology.KANBAN,
  visibility: ProjectVisibility.TEAM,
  priority: ProjectPriority.MEDIUM,
  currency: 'USD',
};

export default function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const currentUser = useAuthStore((state) => state.user);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  const { projectId } = useParams();
  const isEditMode = !!projectId;

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
  const users = useMemo(() => usersData?.users ?? [], [usersData]);
  const projects = useMemo(() => projectsData?.projects ?? [], [projectsData]);
  const stages = useMemo(() => stagesData?.projectStages ?? [], [stagesData]);

  const {
    register,
    handleSubmit,
    reset,
    control,
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
          budgetPlanned: project.budgetPlanned,
          startDate: project.startDate
            ? new Date(project.startDate).toISOString().split('T')[0]
            : '',
          endDate: project.endDate
            ? new Date(project.endDate).toISOString().split('T')[0]
            : '',
          phasesCount: project.phasesCount,
          methodology: project.methodology,
          visibility: project.visibility,
          priority: project.priority,
          currency: project.currency,
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

      const projectFormData = {
        ...formData,
        workspaceId: activeWorkspace.id,
      } as Record<string, unknown>;

      if (projectFormData.responsibleId) {
        projectFormData.responsibleId = parseInt(String(projectFormData.responsibleId));
      }
      if (projectFormData.stageId) {
        projectFormData.stageId = parseInt(String(projectFormData.stageId));
      } else {
        delete projectFormData.stageId;
      }

      if (projectFormData.budgetPlanned) {
        projectFormData.budgetPlanned = parseFloat(
          String(projectFormData.budgetPlanned),
        );
      }
      if (projectFormData.phasesCount) {
        projectFormData.phasesCount = parseInt(String(projectFormData.phasesCount));
      }
      if (!projectFormData.startDate) delete projectFormData.startDate;
      if (!projectFormData.endDate) delete projectFormData.endDate;

      if (isEditMode) {
        if ('__typename' in projectFormData) delete projectFormData.__typename;
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
      Logger.error(err as string);
      setErrorMsg(`${err}`);
    }
  });

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
          <label htmlFor="name" className="label-modern">
            Project Name
          </label>
          <input
            id="name"
            {...register('name', { required: 'Project Name is required' })}
            placeholder="e.g. Marketing Campaign Q3"
            className="input-modern"
          />
          {errors.name && (
            <span className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 block px-1 animate-slide-in-up">
              {errors.name.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="description" className="label-modern">
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="What is this project about?"
            rows={3}
            className="input-modern resize-none"
          />
        </div>
      </div>

      {/* ── Section: Planning ── */}
      <div className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 p-6 rounded-2xl space-y-5 transition-colors">
        <div className="form-section-title text-gray-900 dark:text-white">
          <Calendar size={16} className="text-primary-500" />
          Planning
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="methodology" className="label-modern">
              Methodology
            </label>
            <Controller
              name="methodology"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={Object.values(ProjectMethodology).map((m) => ({
                    id: m,
                    label: m,
                  }))}
                />
              )}
            />
          </div>

          <div>
            <label htmlFor="phasesCount" className="label-modern">
              Number of Phases
            </label>
            <input
              id="phasesCount"
              type="number"
              min="1"
              {...register('phasesCount')}
              className="input-modern"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label htmlFor="endDate" className="label-modern">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              {...register('endDate')}
              className="input-modern"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Financial ── */}
      <div className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 p-6 rounded-2xl space-y-5 transition-colors">
        <div className="form-section-title text-gray-900 dark:text-white">
          <DollarSign size={16} className="text-primary-500" />
          Financial
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="budgetPlanned" className="label-modern">
              Planned Budget
            </label>
            <input
              id="budgetPlanned"
              type="number"
              step="0.01"
              {...register('budgetPlanned')}
              placeholder="0.00"
              className="input-modern"
            />
          </div>

          <div>
            <label htmlFor="currency" className="label-modern">
              Currency
            </label>
            <input
              id="currency"
              {...register('currency')}
              placeholder="USD"
              className="input-modern"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Settings ── */}
      <div className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 p-6 rounded-2xl space-y-5 transition-colors">
        <div className="form-section-title text-gray-900 dark:text-white">
          <Settings2 size={16} className="text-primary-500" />
          Settings
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stageId" className="label-modern">
              Stage
            </label>
            <Controller
              name="stageId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={stages.map((stage: ProjectStage) => ({
                    id: stage.id?.toString() || '',
                    label: stage.title,
                  }))}
                  placeholder="Select Stage"
                />
              )}
            />
          </div>

          <div>
            <label htmlFor="responsibleId" className="label-modern">
              Responsible Person
            </label>
            <Controller
              name="responsibleId"
              control={control}
              rules={{ required: 'Responsible person is required' }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={users.map((u: UserType) => ({
                    id: u.id?.toString() || '',
                    label: `${u.name} (${u.email})`,
                  }))}
                  placeholder="Select User"
                  error={!!errors.responsibleId}
                />
              )}
            />
            {errors.responsibleId && (
              <span className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 block px-1 animate-slide-in-up">
                {errors.responsibleId.message?.toString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="visibility" className="label-modern">
              Visibility
            </label>
            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={Object.values(ProjectVisibility).map((v) => ({
                    id: v,
                    label: v,
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
                  value={field.value}
                  onChange={field.onChange}
                  options={Object.values(ProjectPriority).map((p) => ({
                    id: p,
                    label: p,
                  }))}
                />
              )}
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
            className="px-6 py-2.5 rounded-xl border border-surface-200 dark:border-slate-800 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-surface-50 dark:hover:bg-slate-800 transition-all"
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
              ? 'Update Project'
              : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
