// src/layout/AppLayout.tsx
import { Link, Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="text-lg font-bold mb-4">PM App</h2>
        <nav className="flex flex-col space-y-2">
          <Link to="/users" className="hover:underline">Users</Link>
          <Link to="/projects" className="hover:underline">Projects</Link>
          <Link to="/tasks" className="hover:underline">Tasks</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
