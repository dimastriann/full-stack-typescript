import { useQuery } from '@apollo/client';
import { GET_WEBHOOK_DELIVERY_LOGS } from '../gql/webhook.graphql';
import type {
  WebhookEndpoint,
  WebhookDeliveryLog,
} from '../../../types/Webhooks';
import {
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useState } from 'react';

interface WebhookLogsPageProps {
  webhook: WebhookEndpoint;
  onBack: () => void;
}

export default function WebhookLogsPage({
  webhook,
  onBack,
}: WebhookLogsPageProps) {
  const { data, loading, refetch } = useQuery(GET_WEBHOOK_DELIVERY_LOGS, {
    variables: { endpointId: webhook.id },
    fetchPolicy: 'network-only',
  });

  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const logs: WebhookDeliveryLog[] = data?.webhookDeliveryLogs || [];

  const toggleExpand = (id: number) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatJSON = (val: string) => {
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-slate-800 rounded-xl border border-surface-200 dark:border-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Delivery Logs for {webhook.name}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 select-all">
              {webhook.url}
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-surface-100 dark:hover:bg-slate-850 text-gray-700 dark:text-gray-300 border border-surface-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Logs
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-2xl shadow-card transition-colors">
          <Clock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
          <h3 className="mt-4 text-sm font-bold text-gray-900 dark:text-white">
            No deliveries logged yet
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Events triggered in this workspace will record execution details
            here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 shadow-card border border-surface-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
          <div className="divide-y divide-surface-200 dark:divide-slate-800/80">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isSuccess = log.success;

              return (
                <div
                  key={log.id}
                  className="transition-colors hover:bg-surface-50/50 dark:hover:bg-slate-800/20"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {isSuccess ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 bg-surface-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded">
                            {log.event}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              isSuccess
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            HTTP {log.statusCode || 'N/A'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          ID #{log.id} •{' '}
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-8 md:ml-0">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-mono">
                        {log.durationMs}ms
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Detail Panel */}
                  {isExpanded && (
                    <div className="p-4 bg-surface-50/50 dark:bg-slate-900/30 border-t border-surface-200 dark:border-slate-800/80 space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Request Payload
                        </span>
                        <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-60 shadow-inner select-all">
                          {formatJSON(log.payload)}
                        </pre>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Response Body Preview
                        </span>
                        <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-40 shadow-inner select-all">
                          {log.responseBody || '(Empty response body)'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
