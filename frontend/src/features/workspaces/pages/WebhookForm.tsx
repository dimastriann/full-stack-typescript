import { useForm } from 'react-hook-form';
import { Check, X } from 'lucide-react';
import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import {
  CREATE_WEBHOOK_ENDPOINT,
  UPDATE_WEBHOOK_ENDPOINT,
} from '../gql/webhook.graphql';
import type { WebhookEndpoint } from '../../../types/Webhooks';
import { useWorkspaceStore } from '../../../store/workspaceStore';

interface FormValues {
  name: string;
  url: string;
  events: Record<string, boolean>;
  isActive: boolean;
}

const AVAILABLE_EVENTS = [
  { id: 'task.created', label: 'Task Created' },
  { id: 'task.updated', label: 'Task Updated' },
  { id: 'task.deleted', label: 'Task Deleted' },
  { id: 'project.created', label: 'Project Created' },
  { id: 'project.updated', label: 'Project Updated' },
  { id: 'project.deleted', label: 'Project Deleted' },
];

const defaultValues: FormValues = {
  name: '',
  url: '',
  events: {
    'task.created': true,
    'task.updated': true,
    'task.deleted': true,
    'project.created': true,
    'project.updated': true,
    'project.deleted': true,
  },
  isActive: true,
};

interface WebhookFormProps {
  webhook?: WebhookEndpoint;
  isNew?: boolean;
  onReset?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: (...args: any[]) => any;
}

export default function WebhookForm({
  webhook,
  isNew,
  onReset,
  refetch,
}: WebhookFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });

  const [createWebhook] = useMutation(CREATE_WEBHOOK_ENDPOINT);
  const [updateWebhook] = useMutation(UPDATE_WEBHOOK_ENDPOINT);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  useEffect(() => {
    if (isNew) {
      reset(defaultValues);
    } else if (webhook) {
      const eventMap: Record<string, boolean> = {};
      AVAILABLE_EVENTS.forEach((ev) => {
        eventMap[ev.id] = webhook.events.includes(ev.id);
      });
      reset({
        name: webhook.name,
        url: webhook.url,
        events: eventMap,
        isActive: webhook.isActive,
      });
    }
  }, [webhook, isNew, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!activeWorkspace) return;

    // Convert event map back to string array
    const selectedEvents = Object.keys(data.events).filter(
      (key) => data.events[key],
    );

    if (selectedEvents.length === 0) {
      alert('Please select at least one event subscription.');
      return;
    }

    try {
      if (isNew) {
        await createWebhook({
          variables: {
            input: {
              workspaceId: activeWorkspace.id,
              name: data.name,
              url: data.url,
              events: selectedEvents,
            },
          },
        });
      } else if (webhook) {
        await updateWebhook({
          variables: {
            input: {
              id: webhook.id,
              name: data.name,
              url: data.url,
              events: selectedEvents,
              isActive: data.isActive,
            },
          },
        });
      }

      if (onReset) onReset();
      reset(defaultValues);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Error saving webhook endpoint');
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="p-5 bg-surface-50 dark:bg-slate-900/40 rounded-2xl border border-surface-200 dark:border-slate-800/80 animate-fade-in space-y-4"
    >
      <div className="flex justify-between items-center pb-2 border-b border-surface-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          {isNew ? 'Create Webhook Endpoint' : 'Edit Webhook Endpoint'}
        </h3>
        {!isNew && webhook && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono select-all">
              Secret: {webhook.secret}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
            Endpoint Name
          </label>
          <input
            type="text"
            className="input-modern px-3 py-2 text-sm w-full"
            {...register('name', { required: 'Name is required' })}
            placeholder="e.g. Slack notifications, Zapier push"
          />
          {errors.name && (
            <p className="text-red-500 text-[10px] font-bold mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
            Target URL
          </label>
          <input
            type="text"
            className="input-modern px-3 py-2 text-sm w-full"
            {...register('url', {
              required: 'URL is required',
              pattern: {
                value: /^https?:\/\/[^\s$.?#].[^\s]*$/i,
                message: 'Please enter a valid URL (starting with http/https)',
              },
            })}
            placeholder="e.g. https://your-server.com/webhooks"
          />
          {errors.url && (
            <p className="text-red-500 text-[10px] font-bold mt-1">
              {errors.url.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
          Subscribe to Events
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {AVAILABLE_EVENTS.map((ev) => (
            <label
              key={ev.id}
              className="flex items-center cursor-pointer select-none p-2 bg-white dark:bg-slate-900 rounded-xl border border-surface-200 dark:border-slate-800 hover:bg-surface-100 dark:hover:bg-slate-800/60 transition-all"
            >
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4 mr-2"
                {...register(`events.${ev.id}`)}
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {ev.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          {!isNew && (
            <label className="flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4 mr-2"
                {...register('isActive')}
              />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Webhook Enabled
              </span>
            </label>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-850 text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/10 transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Save Webhook
          </button>
          <button
            type="button"
            onClick={() => {
              if (onReset) onReset();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-850 border border-surface-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
