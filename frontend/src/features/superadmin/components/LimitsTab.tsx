import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import Logger from '../../../lib/logger';
import type { PlanLimitRecord } from '../types';

export default function LimitsTab({
  showToast,
}: {
  showToast: (t: string, e?: boolean) => void;
}) {
  const [limits, setLimits] = useState<PlanLimitRecord[]>([]);
  const [selectedLimit, setSelectedLimit] = useState<PlanLimitRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Form states
  const [maxProjects, setMaxProjects] = useState(0);
  const [maxMembers, setMaxMembers] = useState(0);
  const [maxStorageGb, setMaxStorageGb] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadLimits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/superadmin/plan-limits');
      if (res.ok) {
        const data = (await res.json()) as PlanLimitRecord[];
        setLimits(data);
        if (data.length > 0) {
          selectLimit(data[0]);
        }
      } else {
        showToast('Failed to load plan feature limits', true);
      }
    } catch (err) {
      Logger.error((err as Error).message, err);
      showToast('Error loading plan feature limits', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLimits();
  }, [loadLimits]);

  const selectLimit = (l: PlanLimitRecord) => {
    setSelectedLimit(l);
    setMaxProjects(l.maxProjects);
    setMaxMembers(l.maxMembers);
    setMaxStorageGb(l.maxStorageGb);
  };

  const handleSaveLimits = async () => {
    if (!selectedLimit) return;
    try {
      setSubmitting(true);
      const res = await apiClient.put(
        `/superadmin/plan-limits/${selectedLimit.planLevel}`,
        {
          maxProjects,
          maxMembers,
          maxStorageGb,
        },
      );

      if (res.ok) {
        showToast('Plan feature limits updated successfully');
        loadLimits();
      } else {
        showToast('Failed to update plan limits', true);
      }
    } catch {
      showToast('Connection error updating limits', true);
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
        {/* Left: Plan selector */}
        <div className="md:col-span-1 border-r border-surface-200 dark:border-slate-800 pr-0 md:pr-6 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Plan Feature Limits
          </div>
          {limits.map((l) => (
            <button
              key={l.id}
              onClick={() => selectLimit(l)}
              className={`w-full flex flex-col p-4 rounded-xl text-left border transition-all ${
                selectedLimit?.id === l.id
                  ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10'
                  : 'border-surface-200 dark:border-slate-800 hover:border-surface-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="text-sm font-bold text-gray-900 dark:text-white uppercase">
                {l.planLevel} Plan
              </span>
              <span className="text-[10px] text-gray-400 mt-2 font-medium">
                Projects: {l.maxProjects === -1 ? 'Unlimited' : l.maxProjects} |
                Members: {l.maxMembers === -1 ? 'Unlimited' : l.maxMembers}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Limits configuration */}
        <div className="md:col-span-2 space-y-5">
          {selectedLimit && (
            <>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase">
                {selectedLimit.planLevel} LIMITS CONFIG
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-modern text-gray-700 dark:text-gray-300">
                    Max Projects
                  </label>
                  <input
                    type="number"
                    className="input-modern"
                    value={maxProjects}
                    onChange={(e) =>
                      setMaxProjects(parseInt(e.target.value, 10))
                    }
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">
                    Set to -1 for unlimited projects.
                  </p>
                </div>

                <div>
                  <label className="label-modern text-gray-700 dark:text-gray-300">
                    Max Members
                  </label>
                  <input
                    type="number"
                    className="input-modern"
                    value={maxMembers}
                    onChange={(e) =>
                      setMaxMembers(parseInt(e.target.value, 10))
                    }
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">
                    Set to -1 for unlimited members.
                  </p>
                </div>

                <div>
                  <label className="label-modern text-gray-700 dark:text-gray-300">
                    Max Storage (GB)
                  </label>
                  <input
                    type="number"
                    className="input-modern"
                    value={maxStorageGb}
                    onChange={(e) =>
                      setMaxStorageGb(parseInt(e.target.value, 10))
                    }
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">
                    Set to -1 for unlimited file uploads.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveLimits}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition-all flex items-center gap-2"
                >
                  {submitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Save Limits
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
