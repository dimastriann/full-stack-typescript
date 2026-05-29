import React, { useState } from 'react';
import { useTimesheets } from '../hooks/useTimesheets';
import type { TimesheetType } from '../../../types/Timesheets';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import Modal from '../../../components/Dialog';
import ErrorSection from '../../../components/ErrorSection';
import TimesheetForm from './TimesheetForm';
import Logger from '../../../lib/logger';
import { useAuthStore } from '../../../store/authStore';
import { UserRole } from '../../../types/Users';

const TimesheetRow = React.memo(
  ({
    timesheet,
    isChecked,
    isSelectionMode,
    onEdit,
    onDelete,
    onToggle,
    onApprove,
    onReject,
    isAdmin,
  }: {
    timesheet: TimesheetType;
    isChecked: boolean;
    isSelectionMode: boolean;
    onEdit: (timesheet: TimesheetType) => void;
    onDelete: (timesheet: TimesheetType) => void;
    onToggle: (id: number) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    isAdmin: boolean;
  }) => (
    <tr
      className={`hover:bg-surface-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-surface-100 dark:border-slate-800 ${isChecked ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (timesheet.id) onToggle(timesheet.id);
      }}
    >
      <td className="text-center w-[5%] p-3">
        <input
          onChange={() => timesheet.id && onToggle(timesheet.id)}
          checked={isChecked}
          type="checkbox"
          className="rounded-md border-surface-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 h-4 w-4 bg-white dark:bg-slate-900 transition-colors"
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
        #{timesheet.id}
      </td>
      <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white max-w-xs truncate">
        {timesheet.description}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
        {new Date(timesheet.date).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-black">
        {timesheet.timeSpent}h
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
        {timesheet.user?.name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
        {timesheet.project?.name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500">
        {timesheet.task?.title || '-'}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider
          ${
            timesheet.approvalStatus === 'APPROVED'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : timesheet.approvalStatus === 'REJECTED'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          }`}
        >
          {timesheet.approvalStatus}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-bold">
        ${timesheet.cost?.toLocaleString() || '0.00'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center space-x-3">
          <button
            title="Edit/View"
            className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(timesheet);
            }}
          >
            <Eye className="h-5 w-5" />
          </button>
          {isAdmin && timesheet.approvalStatus === 'PENDING' && (
            <>
              <button
                title="Approve"
                className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  if (timesheet.id) onApprove(timesheet.id);
                }}
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                title="Reject"
                className="p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  if (timesheet.id) onReject(timesheet.id);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}
          {!isSelectionMode && (
            <button
              title="Delete"
              className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(timesheet);
              }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  ),
);

TimesheetRow.displayName = 'TimesheetRow';

export default function TimesheetList() {
  const {
    loading,
    records,
    error,
    refetch,
    setEditingRecord,
    deleteRecord,
    page,
    setPage,
    pageSize,
    approveRecord,
    rejectRecord,
  } = useTimesheets();
  const authUser = useAuthStore((state) => state.user);
  const isAdmin = authUser?.role === UserRole.ADMIN;
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [timesheetToDelete, setTimesheetToDelete] =
    useState<TimesheetType | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const navigate = useNavigate();

  const filteredRecords = React.useMemo(() => {
    if (!searchTerm) return records;
    const lowerTerm = searchTerm.toLowerCase();
    return records.filter(
      (ts) =>
        ts.description?.toLowerCase().includes(lowerTerm) ||
        ts.user?.name?.toLowerCase().includes(lowerTerm) ||
        ts.project?.name?.toLowerCase().includes(lowerTerm),
    );
  }, [records, searchTerm]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredRecords
        .map((ts) => ts.id)
        .filter((id): id is number => id !== undefined);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = React.useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const handleEditTimesheet = React.useCallback(
    (timesheet: TimesheetType) => {
      setEditingRecord(timesheet);
      // navigate(`/dashboard/timesheet/${timesheet.id}`); // Or use modal
      setIsCreateModalOpen(true); // Using modal for now as per user request "similar to task/project" but task uses page, project uses page. Let's use modal for simplicity or page if preferred.
      // Actually, TaskFormPage and ProjectEditPage exist. Let's use Modal for Create and maybe Modal for Edit too for now to be faster, or Page if needed.
      // User said "similar to task and project CRUD". Project uses Page for Edit. Task uses Page for Edit.
      // So I should probably use Page for Edit.
      navigate(`/dashboard/timesheet/${timesheet.id}`);
    },
    [navigate, setEditingRecord],
  );

  const handleDeleteClick = React.useCallback((timesheet: TimesheetType) => {
    setTimesheetToDelete(timesheet);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (timesheetToDelete?.id) {
      try {
        await deleteRecord({ variables: { id: timesheetToDelete.id } });
        await refetch();
        setIsDeleteModalOpen(false);
        setTimesheetToDelete(null);
        setSelectedIds((prev) =>
          prev.filter((id) => id !== timesheetToDelete.id),
        );
      } catch (error) {
        Logger.warn(error as string);
        setErrorMsg(`${error}`);
      }
    }
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) => deleteRecord({ variables: { id } })),
      );
      await refetch();
      setIsBulkDeleteModalOpen(false);
      setSelectedIds([]);
    } catch (error) {
      Logger.warn(error as string);
      setErrorMsg(`Failed to delete some timesheets: ${error}`);
    }
  };

  const handleCreateClick = () => {
    setEditingRecord(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = async () => {
    await refetch();
    setIsCreateModalOpen(false);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );

  const isSelectionMode = selectedIds.length > 0;
  const allSelected =
    filteredRecords.length > 0 && selectedIds.length === filteredRecords.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-surface-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="p-5 border-b border-surface-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-50/50 dark:bg-slate-900/50">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Timesheets
        </h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search timesheets..."
              className="input-modern pl-10 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isSelectionMode && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedIds.length})
            </button>
          )}

          {!isSelectionMode && (
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4">
          <ErrorSection errorMessage={errorMsg} close={setErrorMsg} />
        </div>
      )}

      {error ? (
        <div className="p-8 text-center text-red-600 dark:text-red-400 font-medium">
          Error fetching timesheets: {error.message}
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full table-auto text-left border-collapse">
            <thead>
              <tr className="bg-surface-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-surface-200 dark:border-slate-800">
                <th className="px-4 py-4 text-center w-[5%]">
                  <input
                    onChange={handleSelectAll}
                    checked={allSelected}
                    type="checkbox"
                    className="rounded-md border-surface-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 h-4 w-4 bg-white dark:bg-slate-900 transition-colors"
                  />
                </th>
                <th className="px-4 py-4">ID</th>
                <th className="px-4 py-4">Description</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Time</th>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">Task</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Cost</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-surface-100 dark:divide-slate-800">
              {filteredRecords.map((ts) => (
                <TimesheetRow
                  key={ts.id}
                  timesheet={ts}
                  isChecked={ts.id ? selectedIds.includes(ts.id) : false}
                  isSelectionMode={isSelectionMode}
                  onEdit={handleEditTimesheet}
                  onDelete={handleDeleteClick}
                  onToggle={handleToggleSelect}
                  onApprove={(id) =>
                    approveRecord({ variables: { id } }).then(() => refetch())
                  }
                  onReject={(id) =>
                    rejectRecord({ variables: { id } }).then(() => refetch())
                  }
                  isAdmin={isAdmin}
                />
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 font-medium"
                  >
                    {searchTerm
                      ? 'No timesheets found matching your search.'
                      : 'No timesheets found. Click "Add" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-surface-200 dark:border-slate-800 bg-surface-50/30 dark:bg-slate-900/30 px-4 py-4 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="relative inline-flex items-center rounded-xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={records.length < pageSize}
                className="relative ml-3 inline-flex items-center rounded-xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing page{' '}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {page + 1}
                  </span>
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="relative inline-flex items-center px-3 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-surface-200 dark:ring-slate-800 hover:bg-surface-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={records.length < pageSize}
                    className="relative inline-flex items-center px-3 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-surface-200 dark:ring-slate-800 hover:bg-surface-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Timesheet"
      >
        <TimesheetForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Timesheet"
        maxWidth="sm:max-w-md"
      >
        <div className="mt-2">
          <div className="flex items-center justify-center mb-6 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto transition-colors">
            <Trash2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            Are you sure you want to delete this timesheet? This action cannot
            be undone.
          </p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-md px-6 py-2.5 bg-red-600 text-sm font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            onClick={confirmDelete}
          >
            Delete Timesheet
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-xl border border-surface-200 dark:border-slate-800 shadow-sm px-6 py-2.5 bg-white dark:bg-slate-900 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Delete Timesheets"
        maxWidth="sm:max-w-md"
      >
        <div className="mt-2">
          <div className="flex items-center justify-center mb-6 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto transition-colors">
            <Trash2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {selectedIds.length}
            </span>{' '}
            selected timesheets? This action cannot be undone.
          </p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-md px-6 py-2.5 bg-red-600 text-sm font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            onClick={confirmBulkDelete}
          >
            Delete All Selected
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-xl border border-surface-200 dark:border-slate-800 shadow-sm px-6 py-2.5 bg-white dark:bg-slate-900 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            onClick={() => setIsBulkDeleteModalOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
