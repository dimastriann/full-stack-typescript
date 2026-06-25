import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Plus, Edit2, Trash2, Sliders } from 'lucide-react';
import {
  GET_CUSTOM_FIELD_DEFINITIONS,
  DELETE_CUSTOM_FIELD_DEFINITION,
} from '../gql/custom-field.graphql';
import type { CustomFieldDefinition } from '../../../types/CustomFields';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import CustomFieldDefinitionForm from './CustomFieldDefinitionForm';

export default function CustomFieldDefinitionPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const [filterType, setFilterType] = useState<'ALL' | 'TASK' | 'PROJECT'>(
    'ALL',
  );
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);

  const { data, loading, error, refetch } = useQuery(
    GET_CUSTOM_FIELD_DEFINITIONS,
    {
      variables: {
        workspaceId: activeWorkspace?.id,
        entityType: filterType === 'ALL' ? undefined : filterType,
      },
      skip: !activeWorkspace,
    },
  );

  const [deleteDefinition] = useMutation(DELETE_CUSTOM_FIELD_DEFINITION);

  const definitions: CustomFieldDefinition[] =
    data?.customFieldDefinitions || [];

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this custom field? All saved values on Tasks/Projects will be deleted permanently.',
      )
    ) {
      return;
    }
    try {
      await deleteDefinition({ variables: { id } });
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to delete custom field definition');
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl border border-surface-200 dark:border-slate-800 overflow-hidden mb-8 animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-surface-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Sliders className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Custom Fields definitions
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Entity Filter */}
          <div className="flex items-center space-x-1.5 bg-surface-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('TASK')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'TASK'
                  ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilterType('PROJECT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'PROJECT'
                  ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Projects
            </button>
          </div>

          <button
            onClick={() => setEditingId('new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow transition-all whitespace-nowrap"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Field
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Form for new definition */}
        {editingId === 'new' && (
          <div className="mb-6">
            <CustomFieldDefinitionForm
              isNew
              onReset={() => setEditingId(null)}
              refetch={refetch}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 bg-red-50 dark:bg-red-950/10 rounded-xl">
            Failed to load definitions: {error.message}
          </div>
        ) : definitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400 dark:text-gray-600 border border-dashed border-surface-200 dark:border-slate-800 rounded-2xl">
            <Sliders size={32} strokeWidth={1.5} />
            <p className="text-sm">No custom fields defined yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {definitions.map((definition) => (
              <div key={definition.id} className="group">
                {editingId === definition.id ? (
                  <CustomFieldDefinitionForm
                    definition={definition}
                    onReset={() => setEditingId(null)}
                    refetch={refetch}
                  />
                ) : (
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-primary-200 dark:hover:border-primary-800/80 transition-all">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white text-base">
                        {definition.name}
                      </span>
                      <div className="flex gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 text-[10px] font-black uppercase tracking-wider">
                          {definition.entityType}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          {definition.type}
                        </span>
                        {definition.isRequired && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-wider">
                            Required
                          </span>
                        )}
                      </div>
                      {definition.type === 'SELECT' && definition.options && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold">Options:</span>
                          {definition.options.map((opt) => (
                            <span
                              key={opt}
                              className="px-2 py-0.5 bg-surface-50 dark:bg-slate-800/50 border border-surface-200 dark:border-slate-700/80 rounded-md text-[11px]"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(definition.id)}
                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                        title="Edit Definition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(definition.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Delete Definition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
