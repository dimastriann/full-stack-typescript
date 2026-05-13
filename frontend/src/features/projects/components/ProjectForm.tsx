import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  DollarSign,
  Settings2,
  AlertCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import Logger from '../../../lib/logger';
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

export default function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const currentUser = useAuthStore((state) => state.user);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

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

      const projectFormData: any = {
        ...formData,
        workspaceId: activeWorkspace.id,
      };

      if (projectFormData.responsibleId) {
        projectFormData.responsibleId = parseInt(projectFormData.responsibleId);
      }
      if (projectFormData.stageId) {
        projectFormData.stageId = parseInt(projectFormData.stageId);
      } else {
        delete projectFormData.stageId;
      }

      if (projectFormData.budgetPlanned) {
        projectFormData.budgetPlanned = parseFloat(
          projectFormData.budgetPlanned,
        );
      }
      if (projectFormData.phasesCount) {
        projectFormData.phasesCount = parseInt(projectFormData.phasesCount);
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
            <span className="text-red-500 text-xs mt-1 block">
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
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
          <Calendar size={16} className="text-primary-500" />
          Planning
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="methodology" className="label-modern">
              Methodology
            </label>
            <select
              id="methodology"
              {...register('methodology')}
              className="select-modern"
            >
              {Object.values(ProjectMethodology).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
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
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
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
      <div className="card p-6 space-y-5">
        <div className="form-section-title">
          <Settings2 size={16} className="text-primary-500" />
          Settings
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label htmlFor="responsibleId" className="label-modern">
              Responsible Person
            </label>
            <select
              id="responsibleId"
              {...register('responsibleId', {
                required: 'Responsible person is required',
              })}
              disabled={currentUser?.role === 'USER'}
              className="select-modern disabled:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select User</option>
              {users.map((u: UserType) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            {errors.responsibleId && (
              <span className="text-red-500 text-xs mt-1 block">
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
            <select
              id="visibility"
              {...register('visibility')}
              className="select-modern"
            >
              {Object.values(ProjectVisibility).map((v) => (
                <option key={v} value={v}>
                  {v}
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
              {Object.values(ProjectPriority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
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
          {mutationLoading ? 'Saving...' : isEditMode ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
