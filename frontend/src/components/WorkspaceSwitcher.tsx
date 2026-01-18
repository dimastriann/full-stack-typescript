import { useWorkspace } from '../context/WorkspaceProvider';
import Modal from './Dialog';
import { useMutation } from '@apollo/client';
import { GET_ME } from '../features/auth/gql/auth.graphql';
import { CREATE_WORKSPACE } from '../features/workspaces/gql/workspace.graphql';
import { useState } from 'react';

export const WorkspaceSwitcher = () => {
  const { activeWorkspace, setActiveWorkspace, workspaces } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [createWorkspace] = useMutation(CREATE_WORKSPACE, {
    refetchQueries: [{ query: GET_ME }],
  });

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      await createWorkspace({
        variables: {
          createWorkspaceInput: { name: newWorkspaceName, description: '' },
        },
      });
      setNewWorkspaceName('');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create workspace');
    }
  };

  // Even if 1 workspace, show it to allow creating others
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 p-1 bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 hover:border-blue-400">
        <select
          value={activeWorkspace?.id || ''}
          onChange={(e) => {
            if (e.target.value === 'new') {
              setIsModalOpen(true);
              return;
            }
            const workspace = workspaces.find(
              (w) => w.id.toString() === e.target.value,
            );
            if (workspace) setActiveWorkspace(workspace);
          }}
          className="block w-full pl-2 pr-8 py-1 text-sm bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-gray-700"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
          <option value="new" className="text-blue-600 font-bold">
            + Create Workspace
          </option>
        </select>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Workspace"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="My Awesome Team"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
