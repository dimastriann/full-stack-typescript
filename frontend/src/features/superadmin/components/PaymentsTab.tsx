import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import Logger from '../../../lib/logger';
import type { PaymentProviderConfig } from '../types';

export default function PaymentsTab({
  showToast,
}: {
  showToast: (t: string, e?: boolean) => void;
}) {
  const [providers, setProviders] = useState<PaymentProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [configJson, setConfigJson] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/superadmin/payment-providers');
      if (res.ok) {
        const data = (await res.json()) as PaymentProviderConfig[];
        setProviders(data);
        if (data.length > 0) {
          selectProvider(data[0]);
        }
      } else {
        showToast('Failed to load payment providers config', true);
      }
    } catch (err) {
      Logger.error((err as Error).message, err);
      showToast('Error loading payment configuration', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const selectProvider = (p: PaymentProviderConfig) => {
    setSelectedProvider(p);
    setConfigJson(JSON.stringify(p.config || {}, null, 2));
    setIsDefault(p.isDefault);
    setIsActive(p.isActive);
  };

  const handleSaveConfig = async () => {
    if (!selectedProvider) return;
    try {
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(configJson);
      } catch {
        showToast('Invalid configuration JSON format', true);
        return;
      }

      setSubmitting(true);
      const res = await apiClient.put(
        `/superadmin/payment-providers/${selectedProvider.provider}`,
        {
          config: parsedConfig,
          isDefault,
          isActive,
        },
      );

      if (res.ok) {
        showToast('Payment provider configuration saved');
        loadProviders();
      } else {
        showToast('Failed to save payment config', true);
      }
    } catch {
      showToast('Connection error updating payment config', true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Provider select list */}
        <div className="md:col-span-1 border-r border-surface-200 dark:border-slate-800 pr-0 md:pr-6 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Payment Gateways
          </div>
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProvider(p)}
              className={`w-full flex items-center justify-between p-4 rounded-xl text-left border transition-all ${
                selectedProvider?.id === p.id
                  ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10'
                  : 'border-surface-200 dark:border-slate-800 hover:border-surface-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white uppercase">
                  {p.provider}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {p.isDefault
                    ? 'Default Provider'
                    : p.isActive
                      ? 'Active'
                      : 'Disabled'}
                </div>
              </div>
              <div>
                {p.isActive ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Right Side: Form details */}
        <div className="md:col-span-2 space-y-5">
          {selectedProvider && (
            <>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase">
                {selectedProvider.provider} CONFIGURATION
              </h4>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Gateway Active
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    disabled={!isActive}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Set Default Gateway
                </label>
              </div>

              <div>
                <label className="label-modern text-gray-700 dark:text-gray-300">
                  Configuration JSON
                </label>
                <textarea
                  className="input-modern font-mono text-xs h-64 resize-none text-gray-900 dark:text-white"
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  placeholder={'{\n  "apiKey": "sk_test..."\n}'}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveConfig}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition-all flex items-center gap-2"
                >
                  {submitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Save Gateway
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
