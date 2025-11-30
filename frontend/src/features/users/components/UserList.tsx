import React, { useState } from 'react';
import { useUserContext } from '../hooks/useUsers';
import type { UserType } from '../../../types/Users';
import ErrorSection from '../../../components/ErrorSection';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Modal from '../../../components/Dialog';
import UserForm from './UserForm';

// Separate component for individual user rows to prevent unnecessary re-renders
const UserRow = React.memo(
  ({
    user,
    isChecked,
    isSelectionMode,
    onEdit,
    onDelete,
    onToggle,
  }: {
    user: UserType;
    isChecked: boolean;
    isSelectionMode: boolean;
    onEdit: (user: UserType) => void;
    onDelete: (user: UserType) => void;
    onToggle: (id: number) => void;
  }) => (
    <tr
      className={`hover:bg-gray-50 cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50' : ''}`}
      onClick={(e) => {
        // Prevent toggling when clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        if (user.id) onToggle(user.id);
      }}
    >
      <td className="text-center w-[5%] p-3 border-b border-gray-100">
        <input
          onChange={() => user.id && onToggle(user.id)}
          checked={isChecked}
          type="checkbox"
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700">
        {user.id}
      </td>
      <td className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-900">
        {user.name}
      </td>
      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
        {user.email}
      </td>
      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
        {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '-'}
      </td>
      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
        {user.mobile || '-'}
      </td>
      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
        {user.role}
      </td>
      <td className="px-4 py-3 border-b border-gray-100 text-center">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.status
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {user.status ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-center space-x-3">
          <button
            title="Edit/View"
            className="text-indigo-600 hover:text-indigo-900 font-medium text-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
            }}
          >
            <Eye className="h-5 w-5" />
          </button>
          {!isSelectionMode && (
            <button
              title="Delete"
              className="text-red-600 hover:text-red-900 font-medium text-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user);
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

UserRow.displayName = 'UserRow';

export default function UserList() {
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
  } = useUserContext();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

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
      (user) =>
        user.name?.toLowerCase().includes(lowerTerm) ||
        user.email?.toLowerCase().includes(lowerTerm) ||
        user.role?.toString().toLowerCase().includes(lowerTerm),
    );
  }, [records, searchTerm]);

  // Checkbox Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredRecords
        .map((u) => u.id)
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

  const handleEditUser = React.useCallback(
    (user: UserType) => {
      setEditingRecord(user);
      navigate(`/dashboard/user/${user.id}`);
    },
    [navigate, setEditingRecord],
  );

  const handleDeleteClick = React.useCallback((user: UserType) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (userToDelete?.id) {
      try {
        await deleteRecord({ variables: { id: userToDelete.id } });
        await refetch();
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        // Remove from selection if it was selected
        setSelectedIds((prev) => prev.filter((id) => id !== userToDelete.id));
      } catch (error) {
        console.warn(error);
        setErrorMsg(`${error}`);
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
      console.warn(error);
      setErrorMsg(`Failed to delete some users: ${error}`);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );

  const isSelectionMode = selectedIds.length > 0;
  const allSelected =
    filteredRecords.length > 0 && selectedIds.length === filteredRecords.length;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header Actions */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-semibold text-gray-800">Users</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-grow sm:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Bulk Delete Button */}
          {isSelectionMode && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedIds.length})
            </button>
          )}

          {/* Add User Button */}
          {!isSelectionMode && (
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </button>
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
        <div className="p-8 text-center text-red-600">
          Error fetching users: {error.message}
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
                  Email
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  Birth Date
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  Mobile
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  Role
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200">
                  Status
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRecords.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isChecked={user.id ? selectedIds.includes(user.id) : false}
                  isSelectionMode={isSelectionMode}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteClick}
                  onToggle={handleToggleSelect}
                />
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? 'No users found matching your search.'
                      : 'No users found. Click "Add" to create one.'}
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

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <UserForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
        maxWidth="sm:max-w-md"
      >
        <div className="mt-2">
          <div className="flex items-center justify-center mb-4 text-red-100 bg-red-100 rounded-full w-12 h-12 mx-auto">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Are you sure you want to delete user{' '}
            <span className="font-bold text-gray-900">
              {userToDelete?.name}
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

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Delete Users"
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
            selected users? This action cannot be undone.
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
