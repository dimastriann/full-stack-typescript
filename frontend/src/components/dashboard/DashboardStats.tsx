import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS } from '../../features/dashboard/gql/dashboard.graphql';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Users, FolderGit2, ListTodo } from 'lucide-react';

export default function DashboardStats() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card p-6 h-[116px] animate-pulse flex items-center gap-4"
          >
            <div className="h-12 w-12 bg-surface-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-surface-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-6 bg-surface-200 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-2xl mb-6 shadow-sm">
        <div className="font-semibold mb-1">Error loading statistics</div>
        <div className="text-sm">{error.message}</div>
      </div>
    );
  }

  const stats = data?.dashboardStats || {
    totalUsers: 0,
    activeProjects: 0,
    pendingTasks: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Users Card */}
      <div className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary-400 to-primary-600"></div>
        <div className="flex items-center gap-4 pl-2">
          <div className="h-12 w-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              Total Users
            </h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats.totalUsers}
            </p>
          </div>
        </div>
      </div>

      {/* Projects Card */}
      <div className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
        <div className="flex items-center gap-4 pl-2">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
            <FolderGit2 size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              Active Projects
            </h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats.activeProjects}
            </p>
          </div>
        </div>
      </div>

      {/* Tasks Card */}
      <div className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
        <div className="flex items-center gap-4 pl-2">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 shadow-sm">
            <ListTodo size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              Pending Tasks
            </h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats.pendingTasks}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
