import { useState, useCallback } from 'react';
import { useAuthStore } from '../../../store/authStore';
import {
  ShieldAlert,
  Users,
  Grid,
  CreditCard,
  Sliders,
  TrendingUp,
  Lock,
  Settings,
  Database,
} from 'lucide-react';
import type { Tab } from '../types';
import DashboardTab from '../components/DashboardTab';
import UsersTab from '../components/UsersTab';
import WorkspacesTab from '../components/WorkspacesTab';
import PaymentsTab from '../components/PaymentsTab';
import LimitsTab from '../components/LimitsTab';
import SettingsTab from '../components/SettingsTab';
import BackupsTab from '../components/BackupsTab';

export default function SuperadminPanel() {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  // Flash notification helper
  const showToast = useCallback((text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // Verification guard
  if (currentUser?.role !== 'SUPERADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <Lock className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          You do not have the required SUPERADMIN permissions to access the
          platform panel.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter animate-fade-in">
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
            Monitor overall performance, configure billing details, manage users
            and custom workspace plans.
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
              Payment Gateways
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
              Plan Limits
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-surface-50 dark:hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings & PWA
            </button>
            <button
              onClick={() => setActiveTab('backups')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'backups'
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-surface-50 dark:hover:bg-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              Database Backups
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          {activeTab === 'dashboard' && <DashboardTab showToast={showToast} />}
          {activeTab === 'users' && <UsersTab showToast={showToast} />}
          {activeTab === 'workspaces' && (
            <WorkspacesTab showToast={showToast} />
          )}
          {activeTab === 'payments' && <PaymentsTab showToast={showToast} />}
          {activeTab === 'limits' && <LimitsTab showToast={showToast} />}
          {activeTab === 'settings' && <SettingsTab showToast={showToast} />}
          {activeTab === 'backups' && <BackupsTab showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}
