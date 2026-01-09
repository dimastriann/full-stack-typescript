import { NavLink } from 'react-router-dom';
import {
  UsersIcon,
  FolderIcon,
  LogOut,
  CircleGauge,
  Timer,
  User,
  ListCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout, user } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg p-6 space-y-4
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#3b0a84]">Flow Panel</h2>
            <div className="text-xs text-gray-500">
              Hi, {user?.name || 'Guest'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <NavLink
          to="/dashboard"
          onClick={() => onClose()}
          className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
          end
        >
          <CircleGauge size={18} className="m-1" />
          <span className="ms-2">Overview</span>
        </NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink
            to="/dashboard/users"
            onClick={() => onClose()}
            className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
          >
            <UsersIcon size={18} className="m-1" />
            <span className="ms-2">Users</span>
          </NavLink>
        )}
        <NavLink
          to="/dashboard/projects"
          onClick={() => onClose()}
          className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
        >
          <FolderIcon size={18} className="m-1" />{' '}
          <span className="ms-2">Projects</span>
        </NavLink>
        <NavLink
          to="/dashboard/tasks"
          onClick={() => onClose()}
          className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
        >
          <ListCheck size={18} className="m-1" />{' '}
          <span className="ms-2">Tasks</span>
        </NavLink>
        <NavLink
          to="/dashboard/timesheets"
          onClick={() => onClose()}
          className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
        >
          <Timer size={18} className="m-1" />{' '}
          <span className="ms-2">Timesheets</span>
        </NavLink>
        {/* <NavLink
          to="/dashboard/calendar"
          onClick={() => onClose()}
          className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
        >
          <Calendar size={18} className="m-1" />{' '}
          <span className="ms-2">Calendar</span>
        </NavLink> */}
        <NavLink
          to="/dashboard/profile"
          onClick={() => onClose()}
          className="flex hover:bg-gray-100 py-2 px-3 rounded-lg"
        >
          <User size={18} className="m-1" />{' '}
          <span className="ms-2">Profile</span>
        </NavLink>
        <div
          onClick={logout}
          className="flex hover:bg-gray-100 py-2 px-3 rounded-lg cursor-pointer"
        >
          <LogOut size={18} className="m-1" />{' '}
          <span className="ms-2">Logout</span>
        </div>
      </aside>
    </>
  );
}
