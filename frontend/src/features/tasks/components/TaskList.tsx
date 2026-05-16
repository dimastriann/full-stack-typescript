// features/tasks/components/TaskList.tsx
import React from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskForm from './TaskForm';
import { useState } from 'react';
import type { TaskType } from '../../../types/Tasks';
import {
  Trash2,
  Edit2,
  Search,
  Layout,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Logger from '../../../lib/logger';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/Dialog';
import ErrorSection from '../../../components/ErrorSection';
// import { DnDialog } from '../../../components/Dialog';

const TaskRow = React.memo(
  ({
    task,
    isChecked,
    isSelectionMode,
    onEdit,
    onDelete,
    onToggle,
  }: {
    task: TaskType;
    isChecked: boolean;
    isSelectionMode: boolean;
    onEdit: (task: TaskType) => void;
    onDelete: (task: TaskType) => void;
    onToggle: (id: number) => void;
  }) => (
    <tr
      className={`hover:bg-surface-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-surface-100 dark:border-slate-800 ${isChecked ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
      onClick={(e) => {
        // Prevent toggling when clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        if (task.id) onToggle(task.id);
      }}
    >
      <td className="text-center w-[5%] p-3">
        <input
          onChange={() => task.id && onToggle(task.id)}
          checked={isChecked}
          type="checkbox"
          className="rounded-md border-surface-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 h-4 w-4 bg-white dark:bg-slate-900 transition-colors"
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
        #{task.id}
      </td>
      <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
        {task.title}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
        {task.user?.name || 'Unassigned'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {task.project?.name || '-'}
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider
          ${
            task.stage?.isCompleted
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
          }`}
        >
          {task.stage?.title || 'No Stage'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center space-x-3">
          <button
            title="Edit/View"
            className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          >
            <Edit2 className="h-5 w-5" />
          </button>
          {!isSelectionMode && (
            <button
              title="Delete"
              className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
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

TaskRow.displayName = 'TaskRow';

export default function TaskList() {
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
  } = useTasks();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskType | null>(null);

  // Search and Selection State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const navigate = useNavigate();

  // Filter records based on search term
  const filteredRecords = React.useMemo(() => {
    if (!searchTerm) return records;
    const lowerTerm = searchTerm.toLowerCase();
    return records.filter(
      (task) =>
        task.title?.toLowerCase().includes(lowerTerm) ||
        task.description?.toLowerCase().includes(lowerTerm),
    );
  }, [records, searchTerm]);

  // Checkbox Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredRecords
        .map((task) => task.id)
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

  const handleEditTask = React.useCallback(
    (task: TaskType) => {
      setEditingRecord(task);
      navigate(`/ dashboard / task / ${task.id} `);
    },
    [navigate, setEditingRecord],
  );

  const handleDeleteClick = React.useCallback((task: TaskType) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (taskToDelete?.id) {
      try {
        await deleteRecord({ variables: { id: taskToDelete.id } });
        await refetch();
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
        // Remove from selection if it was selected
        setSelectedIds((prev) => prev.filter((id) => id !== taskToDelete.id));
      } catch (error) {
        Logger.warn(error as string);
        setErrorMsg(`${error} `);
      }
    }
  };

  const confirmBulkDelete = async () => {
    try {
      // Execute all deletes concurrently
      await Promise.all(
        selectedIds.map((id) => deleteRecord({ variables: { id } })),
      );
      await refetch();
      setIsBulkDeleteModalOpen(false);
      setSelectedIds([]);
    } catch (error) {
      Logger.warn(error as string);
      setErrorMsg(`Failed to delete some users: ${error} `);
    }
  };

  const handleCreateClick = () => {
    setEditingRecord(null); // Clear editing record for new user
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
      {/* Header Actions */}
      <div className="p-5 border-b border-surface-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-50/50 dark:bg-slate-900/50">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Tasks
        </h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-grow sm:flex-grow-0 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="input-modern pl-10 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Bulk Delete Button */}
          {isSelectionMode && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedIds.length})
            </button>
          )}

          {/* Add User Button */}
          {!isSelectionMode && (
            <>
              <button
                onClick={() => navigate('/dashboard/tasks')}
                className="inline-flex items-center px-6 py-2.5 border border-surface-200 dark:border-slate-800 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-surface-50 dark:hover:bg-slate-800 transition-all"
              >
                <Layout className="mr-2 h-4 w-4 text-primary-500" />
                Board
              </button>
              <button
                onClick={handleCreateClick}
                className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4">
          <ErrorSection errorMessage={errorMsg} close={setErrorMsg} />
        </div>
      )}

      {/* Table */}
      {error ? (
        <div className="p-8 text-center text-red-600 dark:text-red-400 font-medium">
          Error fetching tasks: {error.message}
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
                <th className="px-4 py-4">Title</th>
                <th className="px-4 py-4">Assignee</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-surface-100 dark:divide-slate-800">
              {filteredRecords.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isChecked={task.id ? selectedIds.includes(task.id) : false}
                  isSelectionMode={isSelectionMode}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteClick}
                  onToggle={handleToggleSelect}
                />
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 font-medium"
                  >
                    {searchTerm
                      ? 'No tasks found matching your search.'
                      : 'No tasks found. Click "Add" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-surface-200 dark:border-slate-800 bg-surface-50/30 dark:bg-slate-900/30 px-4 py-4 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="relative inline-flex items-center rounded-xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={records.length < pageSize}
                className="relative ml-3 inline-flex items-center rounded-xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="mr-2 h-4 w-4" />
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

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
      >
        <TaskForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Task"
        maxWidth="sm:max-w-md"
      >
        <div className="mt-2">
          <div className="flex items-center justify-center mb-6 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto transition-colors">
            <Trash2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            Are you sure you want to delete task{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {taskToDelete?.title}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-md px-6 py-2.5 bg-red-600 text-sm font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            onClick={confirmDelete}
          >
            Delete Task
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

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Delete Users"
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
            selected tasks? This action cannot be undone.
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
