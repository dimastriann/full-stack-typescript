import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import Logger from '../../../lib/logger';
import type { WorkspaceRecord } from '../types';

export default function WorkspacesTab({
  showToast,
}: {
  showToast: (t: string, e?: boolean) => void;
}) {
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiClient.get(`/superadmin/workspaces${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces);
      } else {
        showToast('Failed to load workspaces', true);
      }
    } catch (err) {
      Logger.error((err as Error).message, err);
      showToast('Error loading workspaces', true);
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const handlePlanOverride = async (workspaceId: number, planLevel: string) => {
    try {
      const res = await apiClient.put(
        `/superadmin/workspaces/${workspaceId}/plan`,
        {
          planLevel,
        },
      );

      if (res.ok) {
        showToast('Workspace plan overridden successfully');
        loadWorkspaces();
      } else {
        showToast('Failed to override plan level', true);
      }
    } catch {
      showToast('Connection error overriding plan', true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          className="input-modern pl-10"
          placeholder="Search by workspace name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 dark:bg-slate-950 border-b border-surface-200 dark:border-slate-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Workspace Name</th>
                <th className="px-6 py-4">Total Members</th>
                <th className="px-6 py-4">Total Projects</th>
                <th className="px-6 py-4">Active Plan</th>
                <th className="px-6 py-4">Override Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-slate-800 text-sm text-gray-700 dark:text-gray-300">
              {workspaces.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No workspaces found.
                  </td>
                </tr>
              ) : (
                workspaces.map((w) => {
                  const planLevel = w.subscription?.planLevel || 'FREE';
                  const billingStatus = w.subscription?.status || 'N/A';

                  return (
                    <tr
                      key={w.id}
                      className="hover:bg-surface-50/50 dark:hover:bg-slate-900/40"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {w.name}
                        {w.description && (
                          <p className="text-[10px] text-gray-400 font-normal mt-0.5">
                            {w.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {w.members?.length ?? 0} members
                      </td>
                      <td className="px-6 py-4">
                        {w._count?.projects ?? 0} projects
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">
                            {planLevel}
                          </span>
                          <span className="text-[9px] text-gray-400 capitalize">
                            Status: {billingStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={planLevel}
                          onChange={(e) =>
                            handlePlanOverride(w.id, e.target.value)
                          }
                          className="px-2 py-1 rounded bg-white dark:bg-slate-950 border border-surface-200 dark:border-slate-800 text-xs font-semibold focus:outline-none text-gray-700 dark:text-gray-300"
                        >
                          <option value="FREE">FREE</option>
                          <option value="PRO">PRO</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                          <option value="CUSTOM">CUSTOM</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
