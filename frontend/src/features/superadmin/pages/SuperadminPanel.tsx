import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../lib/apiClient';
import {
  ShieldAlert,
  Users,
  Grid,
  CreditCard,
  Sliders,
  TrendingUp,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
} from 'lucide-react';
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

// ── Types ───────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'users' | 'workspaces' | 'payments' | 'limits';

interface AnalyticsSnapshot {
  id: number;
  snapshotDate: string;
  totalUsers: number;
  totalWorkspaces: number;
  totalProjects: number;
  activeSubscriptions: number;
  mrrEstimate: number;
  newUsersToday: number;
}

interface AnalyticsHistory {
  snapshotDate: string;
  totalUsers: number;
  totalWorkspaces: number;
  activeSubscriptions: number;
  newUsersToday: number;
}

interface UserRecord {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
  createdAt: string;
  workspaceMembers?: Array<{
    workspace?: {
      id: number;
      name: string;
      subscription?: {
        planLevel: string;
        status: string;
      };
    };
  }>;
}

interface WorkspaceRecord {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  subscription?: {
    planLevel: 'FREE' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
    status: string;
    provider: string;
    currentPeriodEnd?: string;
  } | null;
  members: Array<{ userId: number; role: string }>;
  _count: { projects: number };
}

interface PaymentProviderConfig {
  id: number;
  provider: 'STRIPE' | 'XENDIT' | 'MIDTRANS';
  config: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlanLimitRecord {
  id: number;
  planLevel: 'FREE' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  maxProjects: number;
  maxMembers: number;
  maxStorageGb: number;
}

export default function SuperadminPanel() {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Verification guard
  if (currentUser?.role !== 'SUPERADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <Lock className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          You do not have the required SUPERADMIN permissions to access the platform panel.
        </p>
      </div>
    );
  }

  // Flash notification helper
  const showToast = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-surface-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Platform Superadmin
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor overall performance, configure billing details, manage users and custom workspace plans.
          </p>
        </div>

        {/* Global Toast Alert */}
        {message && (
          <div
            className={`mt-4 md:mt-0 px-4 py-3 rounded-xl text-xs font-bold border ${
              message.isError
                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-4 lg:pb-0 border-b border-surface-200 lg:border-b-0 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-surface-50 dark:hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Analytics Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-surface-50 dark:hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              User Directory
            </button>
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'workspaces'
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-surface-50 dark:hover:bg-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              Workspaces & Plans
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-surface-50 dark:hover:bg-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Payment Configuration
            </button>
            <button
              onClick={() => setActiveTab('limits')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'limits'
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-surface-50 dark:hover:bg-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Plan limits Config
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          {activeTab === 'dashboard' && <DashboardTab showToast={showToast} />}
          {activeTab === 'users' && <UsersTab showToast={showToast} />}
          {activeTab === 'workspaces' && <WorkspacesTab showToast={showToast} />}
          {activeTab === 'payments' && <PaymentsTab showToast={showToast} />}
          {activeTab === 'limits' && <LimitsTab showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TAB: DASHBOARD (Analytics)
// ─────────────────────────────────────────────────────────────────────────────

function DashboardTab({ showToast }: { showToast: (t: string, e?: boolean) => void }) {
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
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {snapshot?.totalUsers ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-emerald-500 font-semibold">
            +{snapshot?.newUsersToday ?? 0} registrations today
          </div>
        </div>

        <div className="p-5 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Workspaces</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {snapshot?.totalWorkspaces ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
            Active workspaces count
          </div>
        </div>

        <div className="p-5 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Subscriptions</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {snapshot?.activeSubscriptions ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-indigo-400 font-semibold">
            Paid subscription tiers
          </div>
        </div>

        <div className="p-5 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated MRR</div>
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
            <AreaChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
              <XAxis
                dataKey="snapshotDate"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
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

// ─────────────────────────────────────────────────────────────────────────────
// ── TAB: USERS
// ─────────────────────────────────────────────────────────────────────────────

function UsersTab({ showToast }: { showToast: (t: string, e?: boolean) => void }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiClient.get(`/superadmin/users${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        showToast('Failed to load users', true);
      }
    } catch (err) {
      Logger.error((err as Error).message, err);
      showToast('Error connecting to user service', true);
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const res = await apiClient.patch(`/superadmin/users/${userId}/role`, {
        role: newRole,
      });

      if (res.ok) {
        showToast('User role updated successfully');
        loadUsers();
      } else {
        const errData = await res.json();
        showToast(errData.message || 'Failed to update role', true);
      }
    } catch {
      showToast('Connection error updating role', true);
    }
  };

  const handleBanUser = async (userId: number) => {
    try {
      const res = await apiClient.post(`/superadmin/users/${userId}/ban`, {});
      if (res.ok) {
        showToast('User sessions invalidated (user banned)');
        loadUsers();
      } else {
        showToast('Failed to ban user', true);
      }
    } catch {
      showToast('Connection error banning user', true);
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
          placeholder="Search by name or email…"
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
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-slate-800 text-sm text-gray-700 dark:text-gray-300">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-50/50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.role === 'SUPERADMIN' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold text-xs">
                          SUPERADMIN
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-950 border border-surface-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
                        >
                          <option value="USER">USER</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'SUPERADMIN' && (
                        <button
                          onClick={() => handleBanUser(u.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        >
                          Ban User
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TAB: WORKSPACES
// ─────────────────────────────────────────────────────────────────────────────

function WorkspacesTab({ showToast }: { showToast: (t: string, e?: boolean) => void }) {
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
      const res = await apiClient.put(`/superadmin/workspaces/${workspaceId}/plan`, {
        planLevel,
      });

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
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No workspaces found.
                  </td>
                </tr>
              ) : (
                workspaces.map((w) => {
                  const planLevel = w.subscription?.planLevel || 'FREE';
                  const billingStatus = w.subscription?.status || 'N/A';

                  return (
                    <tr key={w.id} className="hover:bg-surface-50/50 dark:hover:bg-slate-900/40">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {w.name}
                        {w.description && (
                          <p className="text-[10px] text-gray-400 font-normal mt-0.5">{w.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">{w.members?.length ?? 0} members</td>
                      <td className="px-6 py-4">{w._count?.projects ?? 0} projects</td>
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
                          onChange={(e) => handlePlanOverride(w.id, e.target.value)}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-950 border border-surface-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
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

// ─────────────────────────────────────────────────────────────────────────────
// ── TAB: PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

function PaymentsTab({ showToast }: { showToast: (t: string, e?: boolean) => void }) {
  const [providers, setProviders] = useState<PaymentProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderConfig | null>(null);
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
      const res = await apiClient.put(`/superadmin/payment-providers/${selectedProvider.provider}`, {
        config: parsedConfig,
        isDefault,
        isActive,
      });

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
                  {p.isDefault ? 'Default Provider' : p.isActive ? 'Active' : 'Disabled'}
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
                <label className="label-modern">Configuration JSON</label>
                <textarea
                  className="input-modern font-mono text-xs h-64 resize-none"
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  placeholder={'{\n  "apiKey": "sk_test..."\n}'}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveConfig}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold shadow hover:bg-primary-700 transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

// ─────────────────────────────────────────────────────────────────────────────
// ── TAB: PLAN LIMITS
// ─────────────────────────────────────────────────────────────────────────────

function LimitsTab({ showToast }: { showToast: (t: string, e?: boolean) => void }) {
  const [limits, setLimits] = useState<PlanLimitRecord[]>([]);
  const [selectedLimit, setSelectedLimit] = useState<PlanLimitRecord | null>(null);
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
      const res = await apiClient.put(`/superadmin/plan-limits/${selectedLimit.planLevel}`, {
        maxProjects,
        maxMembers,
        maxStorageGb,
      });

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
                Projects: {l.maxProjects === -1 ? 'Unlimited' : l.maxProjects} | Members: {l.maxMembers === -1 ? 'Unlimited' : l.maxMembers}
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
                  <label className="label-modern">Max Projects</label>
                  <input
                    type="number"
                    className="input-modern"
                    value={maxProjects}
                    onChange={(e) => setMaxProjects(parseInt(e.target.value, 10))}
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Set to -1 for unlimited projects.</p>
                </div>

                <div>
                  <label className="label-modern">Max Members</label>
                  <input
                    type="number"
                    className="input-modern"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(parseInt(e.target.value, 10))}
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Set to -1 for unlimited members.</p>
                </div>

                <div>
                  <label className="label-modern">Max Storage (GB)</label>
                  <input
                    type="number"
                    className="input-modern"
                    value={maxStorageGb}
                    onChange={(e) => setMaxStorageGb(parseInt(e.target.value, 10))}
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Set to -1 for unlimited file uploads.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveLimits}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold shadow hover:bg-primary-700 transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
