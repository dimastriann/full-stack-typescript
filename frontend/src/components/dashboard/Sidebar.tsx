import { NavLink, useLocation } from 'react-router-dom';
import {
  UsersIcon,
  FolderIcon,
  LogOut,
  CircleGauge,
  Timer,
  User,
  ListCheck,
  MessageSquare,
  X,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useLogout';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-item ${isActive ? 'nav-item-active' : ''}`;

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const logout = useLogout();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col
          bg-sidebar-bg
          transition-all duration-300 ease-in-out
          lg:static lg:inset-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-[68px]' : 'w-64'}
        `}
      >
        {/* ── Logo / Brand ── */}
        <div className="flex items-center justify-between h-[57px] px-4 border-b border-sidebar-border flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 animate-fade-in">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
                <span className="text-white font-black text-sm">P</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  ProjectFlow
                </h2>
                <p className="text-[10px] text-sidebar-text/60">
                  Workspace
                </p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-sm">P</span>
            </div>
          )}

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden text-sidebar-text hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {/* MAIN */}
          {!isCollapsed && <div className="nav-group-label">Main</div>}
          <NavLink to="/dashboard" end onClick={onClose} className={navLinkClass}>
            <CircleGauge size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Overview</span>}
          </NavLink>

          {/* WORK */}
          {!isCollapsed && <div className="nav-group-label">Work</div>}
          <NavLink to="/dashboard/projects" onClick={onClose} className={navLinkClass}>
            <FolderIcon size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Projects</span>}
          </NavLink>
          <NavLink to="/dashboard/tasks" onClick={onClose} className={navLinkClass}>
            <ListCheck size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Tasks</span>}
          </NavLink>
          <NavLink to="/dashboard/timesheets" onClick={onClose} className={navLinkClass}>
            <Timer size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Timesheets</span>}
          </NavLink>

          {/* PEOPLE */}
          {!isCollapsed && <div className="nav-group-label">People</div>}
          {user?.role === 'ADMIN' && (
            <NavLink to="/dashboard/users" onClick={onClose} className={navLinkClass}>
              <UsersIcon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Users</span>}
            </NavLink>
          )}
          <NavLink to="/dashboard/discuss" onClick={onClose} className={navLinkClass}>
            <MessageSquare size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Discuss</span>}
          </NavLink>

          {/* SETTINGS */}
          {!isCollapsed && <div className="nav-group-label">Settings</div>}
          <NavLink to="/dashboard/profile" onClick={onClose} className={navLinkClass}>
            <User size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Profile</span>}
          </NavLink>
          <NavLink to="/dashboard/workspace/settings" onClick={onClose} className={navLinkClass}>
            <Settings size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Workspace</span>}
          </NavLink>
        </nav>

        {/* ── Bottom: User + Collapse ── */}
        <div className="border-t border-sidebar-border p-3 flex-shrink-0">
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sidebar-text/60 hover:text-white hover:bg-sidebar-hover transition-all text-xs"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={16} className="mx-auto" />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>

          {/* User card */}
          {!isCollapsed && (
            <div className="flex items-center gap-3 mt-2 px-2 py-2 rounded-lg hover:bg-sidebar-hover transition-colors group">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-primary-400/30">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-sidebar-text/60 truncate">
                  {user?.email || user?.role || 'Member'}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-sidebar-text/40 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {isCollapsed && (
            <button
              onClick={logout}
              className="flex items-center justify-center w-full p-2 rounded-lg text-sidebar-text/60 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-2"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
