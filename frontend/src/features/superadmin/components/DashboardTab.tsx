import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Loader2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Logger from '../../../lib/logger';
import type { AnalyticsSnapshot, AnalyticsHistory } from '../types';

export default function DashboardTab({
  showToast,
}: {
  showToast: (t: string, e?: boolean) => void;
}) {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [history, setHistory] = useState<AnalyticsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await apiClient.get('/superadmin/analytics');
        if (res.ok) {
          const data = await res.json();
          setSnapshot(data.snapshot);
          // Reverse historical snapshots to chronological order (left to right in charts)
          setHistory([...data.history].reverse());
        } else {
          showToast('Failed to load platform analytics', true);
        }
      } catch (err) {
        Logger.error('Analytics load error:', err as Error);
        showToast('Error connecting to analytics database', true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Users
          </div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {snapshot?.totalUsers ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-emerald-500 font-semibold">
            +{snapshot?.newUsersToday ?? 0} registrations today
          </div>
        </div>

        <div className="p-5 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Workspaces
          </div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {snapshot?.totalWorkspaces ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
            Active workspaces count
          </div>
        </div>

        <div className="p-5 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Active Subscriptions
          </div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {snapshot?.activeSubscriptions ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-indigo-400 font-semibold">
            Paid subscription tiers
          </div>
        </div>

        <div className="p-5 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Estimated MRR
          </div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            ${snapshot?.mrrEstimate ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-emerald-500 font-semibold">
            Based on active subscriptions
          </div>
        </div>
      </div>

      {/* growth charts */}
      <div className="space-y-6">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
          Platform Growth Over Time
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history}
              margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradWorkspaces" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="snapshotDate"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                }}
                labelStyle={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalUsers"
                name="Total Users"
                stroke="#6366f1"
                fill="url(#gradUsers)"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="totalWorkspaces"
                name="Total Workspaces"
                stroke="#f59e0b"
                fill="url(#gradWorkspaces)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
