import { NavLink, Navigate } from 'react-router-dom';
import { UsersIcon, FolderIcon, ClipboardListIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-lg p-6 space-y-4 max-lg:hidden">
      <h2 className="text-lg font-semibold text-[#3b0a84] mb-4">Flow Panel</h2>
      <NavLink
        to="/dashboard/users"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <UsersIcon size={18} className="m-1" />
        <span className="ms-2">Users</span>
      </NavLink>
      <NavLink
        to="/dashboard/projects"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <FolderIcon size={18} className="m-1" />{' '}
        <span className="ms-2">Projects</span>
      </NavLink>
      <NavLink
        to="/dashboard/tasks"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <ClipboardListIcon size={18} className="m-1" />{' '}
        <span className="ms-2">Tasks</span>
      </NavLink>
      <NavLink
        to="/dashboard/profile"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <ClipboardListIcon size={18} className="m-1" />{' '}
        <span className="ms-2">Timesheets</span>
      </NavLink>
      <NavLink
        to="/dashboard/calendar"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <ClipboardListIcon size={18} className="m-1" />{' '}
        <span className="ms-2">Calendar</span>
      </NavLink>
      <NavLink
        to="/dashboard/blank"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <ClipboardListIcon size={18} className="m-1" />{' '}
        <span className="ms-2">Profile</span>
      </NavLink>
      <NavLink
        to="/dashboard/reports"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <ClipboardListIcon size={18} className="m-1" />{' '}
        <span className="ms-2">Reports</span>
      </NavLink>
      <div
        onClick={logout}
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg cursor-pointer"
      >
        <LogOut size={18} className="m-1" />{' '}
        <span className="ms-2">Logout</span>
      </div>
    </aside>
  );
}
