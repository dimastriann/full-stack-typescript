import { useForm } from 'react-hook-form';
import { Check, X } from 'lucide-react';
import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import {
  CREATE_CUSTOM_FIELD_DEFINITION,
  UPDATE_CUSTOM_FIELD_DEFINITION,
} from '../gql/custom-field.graphql';
import { CustomFieldType } from '../../../types/CustomFields';
import type { CustomFieldDefinition } from '../../../types/CustomFields';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import Select from '../../../components/Select';

interface FormValues {
  name: string;
  entityType: 'TASK' | 'PROJECT';
  type: CustomFieldType;
  optionsString: string;
  isRequired: boolean;
}

const defaultValues: FormValues = {
  name: '',
  entityType: 'TASK',
  type: CustomFieldType.TEXT,
  optionsString: '',
  isRequired: false,
};

interface CustomFieldDefinitionFormProps {
  definition?: CustomFieldDefinition;
  isNew?: boolean;
  onReset?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: (...args: any[]) => any;
}

export default function CustomFieldDefinitionForm({
  definition,
  isNew,
  onReset,
  refetch,
}: CustomFieldDefinitionFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });

  const [createDefinition] = useMutation(CREATE_CUSTOM_FIELD_DEFINITION);
  const [updateDefinition] = useMutation(UPDATE_CUSTOM_FIELD_DEFINITION);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  const selectedType = watch('type');
  const selectedEntityType = watch('entityType');

  useEffect(() => {
    if (isNew) {
      reset(defaultValues);
    } else if (definition) {
      reset({
        name: definition.name,
        entityType: definition.entityType,
        type: definition.type,
        optionsString: definition.options ? definition.options.join(', ') : '',
        isRequired: definition.isRequired,
      });
    }
  }, [definition, isNew, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!activeWorkspace) return;

    const options =
      data.type === CustomFieldType.SELECT
        ? data.optionsString
            .split(',')
            .map((opt) => opt.trim())
            .filter((opt) => opt.length > 0)
        : [];

    try {
      if (isNew) {
        await createDefinition({
          variables: {
            input: {
              workspaceId: activeWorkspace.id,
              entityType: data.entityType,
              name: data.name,
              type: data.type,
              options,
              isRequired: data.isRequired,
            },
          },
        });
      } else if (definition) {
        await updateDefinition({
          variables: {
            id: definition.id,
            input: {
              name: data.name,
              options,
              isRequired: data.isRequired,
            },
          },
        });
      }

      if (onReset) onReset();
      reset(defaultValues);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Error saving custom field definition');
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="flex-1 flex flex-col md:flex-row md:items-end gap-4 p-4 bg-surface-50 dark:bg-slate-900/40 rounded-xl border border-surface-200 dark:border-slate-800/80 animate-fade-in"
    >
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
          Field Name
        </label>
        <input
          type="text"
          className="input-modern px-3 py-2 text-sm"
          {...register('name', { required: 'Name is required' })}
          placeholder="e.g. Estimated Budget, Ticket Ref"
        />
        {errors.name && (
          <p className="text-red-500 text-[10px] font-bold mt-1">
            {errors.name.message}
          </p>
        )}
      </div>

      {isNew ? (
        <>
          <div className="w-full md:w-36">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Applies To
            </label>
            <Select
              value={selectedEntityType}
              onChange={(val) =>
                setValue('entityType', val as 'TASK' | 'PROJECT')
              }
              options={[
                { id: 'TASK', label: 'Tasks' },
                { id: 'PROJECT', label: 'Projects' },
              ]}
              className="text-sm"
            />
          </div>

          <div className="w-full md:w-40">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Data Type
            </label>
            <Select
              value={selectedType}
              onChange={(val) => setValue('type', val as CustomFieldType)}
              options={[
                { id: CustomFieldType.TEXT, label: 'Text' },
                { id: CustomFieldType.NUMBER, label: 'Number' },
                { id: CustomFieldType.DATE, label: 'Date' },
                { id: CustomFieldType.SELECT, label: 'Dropdown Selection' },
              ]}
              className="text-sm"
            />
          </div>
        </>
      ) : (
        <div className="text-xs text-gray-400 dark:text-gray-500 pb-3">
          Type:{' '}
          <span className="font-semibold text-gray-600 dark:text-gray-300">
            {definition?.type}
          </span>{' '}
          ({definition?.entityType.toLowerCase()}s)
        </div>
      )}

      {selectedType === CustomFieldType.SELECT && (
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
            Options (comma separated)
          </label>
          <input
            type="text"
            className="input-modern px-3 py-2 text-sm"
            {...register('optionsString', {
              required:
                selectedType === CustomFieldType.SELECT
                  ? 'Options are required'
                  : false,
            })}
            placeholder="e.g. Low, Medium, High"
          />
          {errors.optionsString && (
            <p className="text-red-500 text-[10px] font-bold mt-1">
              {errors.optionsString.message}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pb-2">
        <label className="flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4 mr-2"
            {...register('isRequired')}
          />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Required
          </span>
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/80 transition-all"
            title="Save"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (onReset) onReset();
            }}
            className="p-2 text-gray-400 hover:bg-surface-50 dark:hover:bg-slate-800 rounded-xl border border-surface-200 dark:border-slate-800 transition-all"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
