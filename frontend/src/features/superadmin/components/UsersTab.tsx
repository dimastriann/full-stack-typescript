import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import Logger from '../../../lib/logger';
import type { UserRecord } from '../types';

export default function UsersTab({
  showToast,
}: {
  showToast: (t: string, e?: boolean) => void;
}) {
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
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-surface-50/50 dark:hover:bg-slate-900/40"
                  >
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
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          className="px-2 py-1 rounded bg-white dark:bg-slate-950 border border-surface-200 dark:border-slate-800 text-xs font-semibold focus:outline-none text-gray-700 dark:text-gray-300"
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
