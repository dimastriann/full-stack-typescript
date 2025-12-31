import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS } from '../../features/dashboard/gql/dashboard.graphql';

export default function DashboardStats() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
        Error loading statistics: {error.message}
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
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
        <p className="text-3xl font-bold text-indigo-600 mt-2">
          {stats.totalUsers}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <h3 className="text-gray-500 text-sm font-medium">Active Projects</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">
          {stats.activeProjects}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <h3 className="text-gray-500 text-sm font-medium">Pending Tasks</h3>
        <p className="text-3xl font-bold text-amber-600 mt-2">
          {stats.pendingTasks}
        </p>
      </div>
    </div>
  );
}
