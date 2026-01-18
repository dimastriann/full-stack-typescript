import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import type { ProjectType } from '../../../types/Projects';
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
import Modal from '../../../components/Dialog';
import ProjectForm from './ProjectForm';
import { useAuth } from '../../../context/AuthProvider';

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
      (m: any) => parseInt(m.user.id) === currentUserId,
    );
    const canDelete =
      userMembership?.role === 'OWNER' || userMembership?.role === 'ADMIN';

    return (
      <tr
        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50' : ''}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          if (project.id) onToggle(project.id);
        }}
      >
        <td className="text-center w-[5%] p-3 border-b border-gray-100">
          <input
            onChange={() => project.id && onToggle(project.id)}
            checked={isChecked}
            type="checkbox"
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            onClick={(e) => e.stopPropagation()}
          />
        </td>
        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700">
          {project.id}
        </td>
        <td className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-900">
          {project.name}
        </td>
        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
          {project.description}
        </td>
        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
          {project.stage?.title || '-'}
        </td>
        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
          {/* @ts-ignore - responsible might be populated */}
          {project.responsible?.name || project.responsibleId}
        </td>
        <td className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-center space-x-3">
            <button
              title="Edit/View"
              className="text-indigo-600 hover:text-indigo-900 font-medium text-sm transition-colors"
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
                className="text-red-600 hover:text-red-900 font-medium text-sm transition-colors"
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
  const { user: authUser } = useAuth();
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
        console.warn(error);
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
      console.warn(error);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );

  const isSelectionMode = selectedIds.length > 0;
  const allSelected =
    filteredRecords.length > 0 && selectedIds.length === filteredRecords.length;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-semibold text-gray-800">Projects</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isSelectionMode && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedIds.length})
            </button>
          )}

          {!isSelectionMode && (
            <>
              <button
                onClick={() => navigate('/dashboard/projects')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Layout className="mr-2 h-4 w-4" />
                Board
              </button>
              <button
                onClick={handleCreateClick}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
        <div className="p-8 text-center text-red-600">
          Error fetching projects: {error.message}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <th className="px-4 py-3 font-medium border-b border-gray-200 text-center w-[5%]">
                  <input
                    onChange={handleSelectAll}
                    checked={allSelected}
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  ID
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  Name
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  Description
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  Status
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  Responsible
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
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
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
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
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={records.length < pageSize}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page + 1}</span>
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={records.length < pageSize}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
          <div className="flex items-center justify-center mb-4 text-red-100 bg-red-100 rounded-full w-12 h-12 mx-auto">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Are you sure you want to delete project{' '}
            <span className="font-bold text-gray-900">
              {projectToDelete?.name}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
            onClick={confirmDelete}
          >
            Delete
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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
          <div className="flex items-center justify-center mb-4 text-red-100 bg-red-100 rounded-full w-12 h-12 mx-auto">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Are you sure you want to delete{' '}
            <span className="font-bold text-gray-900">
              {selectedIds.length}
            </span>{' '}
            selected projects? This action cannot be undone.
          </p>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
            onClick={confirmBulkDelete}
          >
            Delete All
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            onClick={() => setIsBulkDeleteModalOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
