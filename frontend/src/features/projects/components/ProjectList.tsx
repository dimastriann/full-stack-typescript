import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import type { ProjectType, ProjectMember } from '../../../types/Projects';
import ErrorSection from '../../../components/ErrorSection';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Layout,
} from 'lucide-react';
import Logger from '../../../lib/logger';
import Modal from '../../../components/Dialog';
import ProjectForm from './ProjectForm';
import { useAuthStore } from '../../../store/authStore';

const ProjectRow = React.memo(
  ({
    project,
    isChecked,
    isSelectionMode,
    currentUserId,
    onEdit,
    onDelete,
    onToggle,
  }: {
    project: ProjectType;
    isChecked: boolean;
    isSelectionMode: boolean;
    currentUserId: number;
    onEdit: (project: ProjectType) => void;
    onDelete: (project: ProjectType) => void;
    onToggle: (id: number) => void;
  }) => {
    const userMembership = project.members?.find(
      (m: ProjectMember) => m.userId === currentUserId,
    );
    const canDelete =
      userMembership?.role === 'OWNER' || userMembership?.role === 'ADMIN';

    return (
      <tr
        className={`hover:bg-surface-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-surface-100 dark:border-slate-800 ${isChecked ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          if (project.id) onToggle(project.id);
        }}
      >
        <td className="text-center w-[5%] p-3">
          <input
            onChange={() => project.id && onToggle(project.id)}
            checked={isChecked}
            type="checkbox"
            className="rounded-md border-surface-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 h-4 w-4 bg-white dark:bg-slate-900 transition-colors"
            onClick={(e) => e.stopPropagation()}
          />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
          #{project.id}
        </td>
        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
          <div className="flex flex-col">
            <span>{project.name}</span>
            <span className="text-[10px] text-primary-500 dark:text-primary-400 font-black uppercase tracking-wider">
              {project.key}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {project.description}
        </td>
        <td className="px-4 py-3 text-sm">
          <span
            className={`inline-flex px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider
            ${
              project.stage?.isCompleted
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
            }`}
          >
            {project.stage?.title || 'No Stage'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
          {project.responsible?.name || project.responsibleId}
        </td>
        <td className="px-4 py-3 text-sm">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
              project.priority === 'CRITICAL'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : project.priority === 'HIGH'
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  : project.priority === 'MEDIUM'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-surface-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {project.priority}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="w-full bg-surface-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-primary-600 dark:bg-primary-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
            {project.progress}%
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              P: ${project.budgetPlanned?.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              A: ${project.budgetActual?.toLocaleString()}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center font-bold">
          {project.totalHours || 0}h
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center space-x-3">
            <button
              title="Edit/View"
              className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            >
              <Eye className="h-5 w-5" />
            </button>
            {!isSelectionMode && canDelete && (
              <button
                title="Delete"
                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                }}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  },
);

ProjectRow.displayName = 'ProjectRow';

export default function ProjectList() {
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
  } = useProjects();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectType | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const currentUserId = authUser?.id || 0;

  const filteredRecords = React.useMemo(() => {
    if (!searchTerm) return records;
    const lowerTerm = searchTerm.toLowerCase();
    return records.filter(
      (project) =>
        project.name?.toLowerCase().includes(lowerTerm) ||
        project.description?.toLowerCase().includes(lowerTerm),
    );
  }, [records, searchTerm]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredRecords
        .map((p) => p.id)
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

  const handleEditProject = React.useCallback(
    (project: ProjectType) => {
      setEditingRecord(project);
      navigate(`/dashboard/project/${project.id}`);
    },
    [navigate, setEditingRecord],
  );

  const handleDeleteClick = React.useCallback((project: ProjectType) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (projectToDelete?.id) {
      try {
        await deleteRecord({ variables: { id: projectToDelete.id } });
        await refetch();
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
        setSelectedIds((prev) =>
          prev.filter((id) => id !== projectToDelete.id),
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
      setErrorMsg(`Failed to delete some projects: ${error}`);
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
          Projects
        </h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
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
            <>
              <button
                onClick={() => navigate('/dashboard/projects')}
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

      {errorMsg && (
        <div className="p-4">
          <ErrorSection errorMessage={errorMsg} close={setErrorMsg} />
        </div>
      )}

      {error ? (
        <div className="p-8 text-center text-red-600 dark:text-red-400">
          Error fetching projects: {error.message}
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
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Description</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Responsible</th>
                <th className="px-4 py-4">Priority</th>
                <th className="px-4 py-4">Progress</th>
                <th className="px-4 py-4">Budget (P/A)</th>
                <th className="px-4 py-4 text-center">Hours</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-surface-100 dark:divide-slate-800">
              {filteredRecords.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isChecked={
                    project.id ? selectedIds.includes(project.id) : false
                  }
                  isSelectionMode={isSelectionMode}
                  currentUserId={currentUserId}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteClick}
                  onToggle={handleToggleSelect}
                />
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 font-medium"
                  >
                    {searchTerm
                      ? 'No projects found matching your search.'
                      : 'No projects found. Click "Add" to create one.'}
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
        title="Create New Project"
      >
        <ProjectForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project"
        maxWidth="sm:max-w-md"
      >
        <div className="mt-2">
          <div className="flex items-center justify-center mb-6 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto transition-colors">
            <Trash2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            Are you sure you want to delete project{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {projectToDelete?.name}
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
            Delete Project
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
        title="Delete Projects"
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
            selected projects? This action cannot be undone.
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
