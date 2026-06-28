import { useQuery, useMutation } from '@apollo/client';
import {
  GET_WEBHOOK_ENDPOINTS,
  DELETE_WEBHOOK_ENDPOINT,
  TEST_WEBHOOK_ENDPOINT,
} from '../gql/webhook.graphql';
import type { WebhookEndpoint } from '../../../types/Webhooks';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import {
  Plus,
  Settings,
  Trash2,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  FileText,
  Play,
} from 'lucide-react';
import { useState } from 'react';
import WebhookForm from './WebhookForm';
import WebhookLogsPage from './WebhookLogsPage';

export default function WebhookDefinitionPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  const { data, loading, refetch } = useQuery(GET_WEBHOOK_ENDPOINTS, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });

  const [deleteWebhook] = useMutation(DELETE_WEBHOOK_ENDPOINT);
  const [testWebhook] = useMutation(TEST_WEBHOOK_ENDPOINT);

  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [viewingLogsWebhook, setViewingLogsWebhook] =
    useState<WebhookEndpoint | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<number | null>(null);

  const webhooks: WebhookEndpoint[] = data?.webhookEndpoints || [];

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await deleteWebhook({ variables: { id } });
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to delete webhook');
    }
  };

  const handleTest = async (id: number) => {
    setTestingWebhookId(id);
    try {
      const res = await testWebhook({ variables: { id } });
      const log = res.data?.testWebhookEndpoint;
      if (log?.success) {
        alert(
          `Success!\nEvent: ${log.event}\nStatus: HTTP ${log.statusCode}\nDuration: ${log.durationMs}ms`,
        );
      } else {
        alert(
          `Failed!\nEvent: ${log?.event}\nStatus: HTTP ${log?.statusCode || 'N/A'}\nError: ${
            log?.responseBody || 'Unknown'
          }`,
        );
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      alert(`Test execution failed: ${error.message}`);
    } finally {
      setTestingWebhookId(null);
    }
  };

  if (viewingLogsWebhook) {
    return (
      <WebhookLogsPage
        webhook={viewingLogsWebhook}
        onBack={() => setViewingLogsWebhook(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Webhook Subscriptions
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Deliver JSON payloads to HTTP endpoints in real-time when project or
            task changes happen.
          </p>
        </div>

        {!isCreating && !editingWebhook && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Webhook
          </button>
        )}
      </div>

      {(isCreating || editingWebhook) && (
        <WebhookForm
          isNew={isCreating}
          webhook={editingWebhook || undefined}
          onReset={() => {
            setIsCreating(false);
            setEditingWebhook(null);
          }}
          refetch={refetch}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-2xl shadow-card transition-colors">
          <ShieldAlert className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
          <h3 className="mt-4 text-sm font-bold text-gray-900 dark:text-white">
            No Webhooks configured
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Set up an endpoint to push events directly to Slack, Discord,
            Zapier, or your own server.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 rounded-2xl p-5 hover:border-surface-300 dark:hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {wh.name}
                  </h3>
                  <div className="flex items-center">
                    {wh.isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded-full">
                        <ToggleRight className="h-3.5 w-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-surface-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                        <ToggleLeft className="h-3.5 w-3.5" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono select-all">
                  {wh.url}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {wh.events.map((ev) => (
                    <span
                      key={ev}
                      className="text-[9px] font-extrabold font-mono bg-surface-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full uppercase"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setViewingLogsWebhook(wh)}
                  className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-850 hover:text-gray-900 dark:hover:text-white border border-surface-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="View History logs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Logs
                </button>

                <button
                  onClick={() => handleTest(wh.id)}
                  disabled={testingWebhookId === wh.id}
                  className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 border border-surface-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  title="Send ping event"
                >
                  <Play
                    className={`h-3.5 w-3.5 ${testingWebhookId === wh.id ? 'animate-spin' : ''}`}
                  />
                  Test
                </button>

                <button
                  onClick={() => setEditingWebhook(wh)}
                  className="p-2 bg-white dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-surface-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Configure"
                >
                  <Settings className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleDelete(wh.id)}
                  className="p-2 bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-surface-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Remove Webhook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
