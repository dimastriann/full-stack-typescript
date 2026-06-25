import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Sliders, AlertCircle } from 'lucide-react';
import {
  GET_CUSTOM_FIELD_DEFINITIONS,
  GET_CUSTOM_FIELD_VALUES,
} from '../gql/custom-field.graphql';
import type {
  CustomFieldDefinition,
  CustomFieldValue,
} from '../../../types/CustomFields';
import { CustomFieldType } from '../../../types/CustomFields';
import Select from '../../../components/Select';

interface CustomFieldsFormSectionProps {
  workspaceId: number;
  entityType: 'TASK' | 'PROJECT';
  entityId?: number;
  onValuesChange: (values: Record<number, string>, isValid: boolean) => void;
}

export default function CustomFieldsFormSection({
  workspaceId,
  entityType,
  entityId,
  onValuesChange,
}: CustomFieldsFormSectionProps) {
  const [localValues, setLocalValues] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  const onValuesChangeRef = useRef(onValuesChange);
  useEffect(() => {
    onValuesChangeRef.current = onValuesChange;
  }, [onValuesChange]);

  // 1. Fetch field definitions
  const { data: defsData, loading: defsLoading } = useQuery(
    GET_CUSTOM_FIELD_DEFINITIONS,
    {
      variables: { workspaceId, entityType },
      skip: !workspaceId,
    },
  );

  const definitions = useMemo<CustomFieldDefinition[]>(
    () => defsData?.customFieldDefinitions || [],
    [defsData],
  );

  // 2. Fetch existing values (if editing)
  const { data: valsData, loading: valsLoading } = useQuery(
    GET_CUSTOM_FIELD_VALUES,
    {
      variables: { entityId, workspaceId },
      skip: !entityId || !workspaceId,
    },
  );

  // Sync loaded values into local state
  useEffect(() => {
    if (valsData?.customFieldValues) {
      const loadedValues: Record<number, string> = {};
      valsData.customFieldValues.forEach((val: CustomFieldValue) => {
        loadedValues[val.fieldId] = val.value;
      });
      setLocalValues((prev) => ({ ...prev, ...loadedValues }));
    }
  }, [valsData]);

  // Handle value change and perform validation
  const handleValueChange = (fieldId: number, rawValue: string) => {
    const updatedValues = { ...localValues, [fieldId]: rawValue };
    setLocalValues(updatedValues);

    const definition = definitions.find((d) => d.id === fieldId);
    const updatedErrors = { ...errors };

    if (definition) {
      const errorMsg = validateField(definition, rawValue);
      if (errorMsg) {
        updatedErrors[fieldId] = errorMsg;
      } else {
        delete updatedErrors[fieldId];
      }
      setErrors(updatedErrors);
    }

    // Trigger parent callback
    const isValid = checkValidity(definitions, updatedValues, updatedErrors);
    onValuesChange(updatedValues, isValid);
  };

  const validateField = (
    definition: CustomFieldDefinition,
    value: string,
  ): string | null => {
    const trimmed = value.trim();

    if (definition.isRequired && !trimmed) {
      return `${definition.name} is required`;
    }

    if (trimmed) {
      if (definition.type === CustomFieldType.NUMBER) {
        if (isNaN(Number(trimmed))) {
          return `${definition.name} must be a valid number`;
        }
      } else if (definition.type === CustomFieldType.DATE) {
        if (isNaN(Date.parse(trimmed))) {
          return `${definition.name} must be a valid date`;
        }
      }
    }

    return null;
  };

  const checkValidity = (
    defs: CustomFieldDefinition[],
    vals: Record<number, string>,
    errs: Record<number, string>,
  ): boolean => {
    // 1. If any field has active validation errors, form is invalid
    if (Object.keys(errs).length > 0) return false;

    // 2. Check if all required fields are filled
    for (const def of defs) {
      if (def.isRequired) {
        const val = vals[def.id];
        if (!val || !val.trim()) {
          return false;
        }
      }
    }

    return true;
  };

  // Sync parent validity when definitions load/change
  useEffect(() => {
    if (definitions.length > 0) {
      const isValid = checkValidity(definitions, localValues, errors);
      onValuesChangeRef.current(localValues, isValid);
    }
  }, [definitions, localValues, errors]);

  if (defsLoading || valsLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-2xl">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (definitions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 p-6 rounded-2xl space-y-5 transition-colors">
      <div className="form-section-title text-gray-900 dark:text-white">
        <Sliders size={16} className="text-primary-500" />
        Custom Fields
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {definitions.map((def) => {
          const value = localValues[def.id] || '';
          const error = errors[def.id];

          return (
            <div key={def.id} className="space-y-1.5">
              <label className="label-modern flex items-center">
                {def.name}
                {def.isRequired && (
                  <span className="text-red-500 dark:text-red-400 ml-1 font-bold">
                    *
                  </span>
                )}
              </label>

              {def.type === CustomFieldType.SELECT ? (
                <Select
                  value={value}
                  onChange={(val) => handleValueChange(def.id, String(val))}
                  options={(def.options || []).map((opt) => ({
                    id: opt,
                    label: opt,
                  }))}
                  placeholder={`Select ${def.name}`}
                  error={!!error}
                />
              ) : def.type === CustomFieldType.DATE ? (
                <input
                  type="date"
                  value={value}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  className={`input-modern ${error ? 'border-red-400 dark:border-red-500' : ''}`}
                />
              ) : def.type === CustomFieldType.NUMBER ? (
                <input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  placeholder="Enter number"
                  className={`input-modern ${error ? 'border-red-400 dark:border-red-500' : ''}`}
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  placeholder="Enter text"
                  className={`input-modern ${error ? 'border-red-400 dark:border-red-500' : ''}`}
                />
              )}

              {error && (
                <p className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1 animate-slide-in-up">
                  <AlertCircle size={12} />
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
