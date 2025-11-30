import { NavLink } from 'react-router-dom';
import {
  UsersIcon,
  FolderIcon,
  ClipboardListIcon,
  LogOut,
  CircleGauge,
  Timer,
  Calendar,
  User,
  ListCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-lg p-6 space-y-4 max-lg:hidden">
      <h2 className="text-lg font-semibold text-[#3b0a84] mb-4">Flow Panel</h2>
      <NavLink
        to="/dashboard"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <CircleGauge size={18} className="m-1" />
        <span className="ms-2">Overview</span>
      </NavLink>
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
        <ListCheck size={18} className="m-1" />{' '}
        <span className="ms-2">Tasks</span>
      </NavLink>
      <NavLink
        to="/dashboard/profile"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <Timer size={18} className="m-1" />{' '}
        <span className="ms-2">Timesheets</span>
      </NavLink>
      <NavLink
        to="/dashboard/calendar"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <Calendar size={18} className="m-1" />{' '}
        <span className="ms-2">Calendar</span>
      </NavLink>
      <NavLink
        to="/dashboard/profile"
        className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
      >
        <User size={18} className="m-1" /> <span className="ms-2">Profile</span>
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
