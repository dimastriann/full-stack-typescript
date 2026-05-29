import { useForm } from 'react-hook-form';
import type { ProjectStage } from '../../../types/Projects';
import { Check, Edit2, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  CREATE_PROJECT_STAGE,
  REMOVE_PROJECT_STAGE,
  UPDATE_PROJECT_STAGE,
} from '../gql/workspace.graphql';
import { useWorkspaceStore } from '../../../store/workspaceStore';

const defaultValues: Omit<ProjectStage, 'id'> = {
  title: '',
  sequence: 5,
  color: '#000000',
  isCompleted: false,
  isCanceled: false,
};

interface ProjectStageFormProps {
  stage?: ProjectStage;
  isNew?: boolean;
  onReset?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: (...args: any[]) => any;
}

export default function ProjectStageForm({
  stage,
  isNew,
  onReset,
  refetch,
}: ProjectStageFormProps) {
  const [editingId, setEditingId] = useState<number | null | undefined>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues });
  const [createProjectStage] = useMutation(CREATE_PROJECT_STAGE);
  const [updateProjectStage] = useMutation(UPDATE_PROJECT_STAGE);
  const [removeProjectStage] = useMutation(REMOVE_PROJECT_STAGE);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  useEffect(() => {
    if (isNew) {
      reset(defaultValues);
    } else {
      reset(stage);
    }
  }, [stage, isNew, reset]);

  const onSubmitProjectStage = handleSubmit(async (data) => {
    if ('__typename' in data) {
      delete data.__typename;
    }

    if (editingId) {
      await updateProjectStage({
        variables: {
          updateProjectStageInput: {
            id: editingId,
            ...data,
          },
        },
      });
    } else {
      await createProjectStage({
        variables: {
          createProjectStageInput: {
            ...data,
            workspaceId: activeWorkspace?.id,
          },
        },
      });
    }
    setEditingId(null);
    if (onReset) onReset();
    reset(defaultValues);
    refetch();
  });

  const handleRemoveProjectStage = async () => {
    if (!confirm('Are you sure? This might affect existing projects.')) return;
    await removeProjectStage({ variables: { id: stage?.id } });
    setEditingId(null);
    reset(defaultValues);
    refetch();
  };

  return (
    <>
      {(stage && stage.id === editingId) || isNew ? (
        <div className="flex-1 flex items-center space-x-3">
          <div className="w-16">
            <label className="block text-[10px] text-gray-400 uppercase">
              Seq
            </label>
            <input
              type="number"
              className="input-modern px-3 py-2 text-sm"
              {...register('sequence', {
                valueAsNumber: true,
              })}
            />
            {errors.sequence && (
              <p className="text-red-500 dark:text-red-400 text-[10px] font-bold mt-1 px-1">
                {errors.sequence.message}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 uppercase">
              Title
            </label>
            <input
              type="text"
              className="input-modern px-3 py-2 text-sm"
              {...register('title')}
              autoFocus
            />
            {errors.title && (
              <p className="text-red-500 dark:text-red-400 text-[10px] font-bold mt-1 px-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => onSubmitProjectStage()}
              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 transition-all"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                if (onReset) onReset();
                setEditingId(null);
              }}
              className="p-2 text-gray-400 hover:bg-surface-50 dark:hover:bg-slate-800 rounded-xl border border-surface-200 dark:border-slate-800 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center space-x-4">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-100 dark:bg-slate-800 text-[10px] font-black text-gray-500 dark:text-gray-400 border border-surface-200 dark:border-slate-700"
              title="Sequence"
            >
              {stage?.sequence}
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              {stage?.title}
            </span>
            {stage?.isCompleted && (
              <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-wider">
                Completed
              </span>
            )}
          </div>
          <div className="invisible group-hover:visible flex items-center space-x-1">
            <button
              onClick={() => setEditingId(stage?.id)}
              className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRemoveProjectStage()}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
