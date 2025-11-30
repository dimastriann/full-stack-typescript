export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium">Active Projects</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium">Pending Tasks</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
      </div>
    </div>
  );
}
