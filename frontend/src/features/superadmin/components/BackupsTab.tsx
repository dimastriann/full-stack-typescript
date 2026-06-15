import { useState, useEffect, useCallback } from 'react';
import { Loader2, Play, Download, Trash2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import type { BackupRecord } from '../types';

export default function BackupsTab({
  showToast,
}: {
  showToast: (t: string, e?: boolean) => void;
}) {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadBackups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/superadmin/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      } else {
        showToast('Failed to load backup files', true);
      }
    } catch {
      showToast('Error loading backups', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleTriggerBackup = async () => {
    try {
      setTriggering(true);
      const res = await apiClient.post('/superadmin/backups/trigger');
      if (res.ok) {
        showToast('Database backup completed successfully!');
        loadBackups();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to trigger backup', true);
      }
    } catch {
      showToast(
        'Error triggering database backup. Make sure pg_dump is available on system path.',
        true,
      );
    } finally {
      setTriggering(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete backup: ${filename}?`,
      )
    )
      return;
    try {
      const res = await apiClient.delete(
        `/superadmin/backups/${encodeURIComponent(filename)}`,
      );
      if (res.ok) {
        showToast('Backup deleted successfully');
        loadBackups();
      } else {
        showToast('Failed to delete backup file', true);
      }
    } catch {
      showToast('Error deleting backup file', true);
    }
  };

  const getDownloadUrl = (filename: string) => {
    return `/superadmin/backups/download/${encodeURIComponent(filename)}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-200 dark:border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Database Backup Strategy
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create on-demand backups or download automated zip archives of the
            database.
          </p>
        </div>
        <button
          onClick={handleTriggerBackup}
          disabled={triggering}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
        >
          {triggering ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          Trigger Backup Now
        </button>
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
                <th className="px-6 py-4">Filename</th>
                <th className="px-6 py-4">Backup Size</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-slate-800 text-sm text-gray-700 dark:text-gray-300">
              {backups.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No database backups found. Trigger a backup to create one.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr
                    key={b.filename}
                    className="hover:bg-surface-50/50 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white font-semibold">
                      {b.filename}
                    </td>
                    <td className="px-6 py-4">{formatBytes(b.size)}</td>
                    <td className="px-6 py-4">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <a
                        href={getDownloadUrl(b.filename)}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                      <button
                        onClick={() => handleDeleteBackup(b.filename)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
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
