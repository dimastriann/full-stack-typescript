import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useWorkspace } from '../../../context/WorkspaceProvider';
import { GET_PROJECT_STAGES } from '../../projects/gql/project.graphql';
import { GET_TASK_STAGES } from '../../tasks/gql/task.graphql';
import { GET_ME } from '../../auth/gql/auth.graphql';
import {
  UPDATE_WORKSPACE,
  INVITE_TO_WORKSPACE,
  UPDATE_WORKSPACE_MEMBER_ROLE,
  REMOVE_WORKSPACE_MEMBER,
  GET_WORKSPACE,
} from '../gql/workspace.graphql';
import {
  Plus,
  Edit2,
  Check,
  X,
  Settings,
  Briefcase,
  Users,
  Mail,
  UserX,
} from 'lucide-react';
import { WorkspaceRole } from '../../../types/Workspaces';
import ProjectStagePage from './ProjectStagePage';
import TaskStagePage from './TaskStagePage';

export default function WorkspaceSettingsPage() {
  const { activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [editingId, setEditingId] = useState<
    number | 'new' | 'workspace' | 'invite' | null
  >(null);

  // Workspace name editing state
  const [workspaceName, setWorkspaceName] = useState(
    activeWorkspace?.name || '',
  );

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>(
    WorkspaceRole.MEMBER,
  );

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  const { data: workspaceData, refetch: refetchWorkspace } = useQuery(
    GET_WORKSPACE,
    {
      variables: { id: activeWorkspace?.id },
      skip: !activeWorkspace,
    },
  );

  const fullWorkspace = workspaceData?.workspace || activeWorkspace;

  const { data: projectStagesData, refetch: refetchProjectStages } = useQuery(
    GET_PROJECT_STAGES,
    {
      variables: { workspaceId: activeWorkspace?.id },
      skip: !activeWorkspace,
    },
  );
  const projectStages = projectStagesData?.projectStages || [];

  const { data: taskStagesData, refetch: refetchTaskStages } = useQuery(
    GET_TASK_STAGES,
    {
      variables: { workspaceId: activeWorkspace?.id },
      skip: !activeWorkspace,
    },
  );
  const taskStages = taskStagesData?.taskStages || [];

  const [updateWorkspace] = useMutation(UPDATE_WORKSPACE, {
    refetchQueries: [{ query: GET_ME }],
  });

  // Member management mutations
  const [inviteUser] = useMutation(INVITE_TO_WORKSPACE, {
    refetchQueries: [{ query: GET_ME }],
    onCompleted: () => refetchWorkspace(),
  });
  const [updateMemberRole] = useMutation(UPDATE_WORKSPACE_MEMBER_ROLE, {
    refetchQueries: [{ query: GET_ME }],
    onCompleted: () => refetchWorkspace(),
  });
  const [removeMember] = useMutation(REMOVE_WORKSPACE_MEMBER, {
    refetchQueries: [{ query: GET_ME }],
    onCompleted: () => refetchWorkspace(),
  });

  const handleUpdateWorkspace = async () => {
    if (!workspaceName.trim() || !activeWorkspace) return;
    try {
      const { data } = await updateWorkspace({
        variables: {
          updateWorkspaceInput: { id: activeWorkspace.id, name: workspaceName },
        },
      });
      if (data?.updateWorkspace) {
        setActiveWorkspace(data.updateWorkspace);
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update workspace');
    } finally {
      location.reload();
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !activeWorkspace) return;
    try {
      await inviteUser({
        variables: {
          input: {
            workspaceId: activeWorkspace.id,
            email: inviteEmail,
            role: inviteRole,
          },
        },
      });
      setInviteEmail('');
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to invite user');
    }
  };

  const handleUpdateRole = async (userId: number, role: WorkspaceRole) => {
    if (!activeWorkspace) return;
    try {
      await updateMemberRole({
        variables: {
          input: {
            workspaceId: activeWorkspace.id,
            userId,
            role,
          },
        },
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (
      !activeWorkspace ||
      !confirm('Are you sure you want to remove this member?')
    )
      return;
    try {
      await removeMember({
        variables: {
          input: {
            workspaceId: activeWorkspace.id,
            userId,
          },
        },
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to remove member');
    }
  };

  if (!activeWorkspace)
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a workspace
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="h-8 w-8 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
      </div>

      {/* Workspace Info Section */}
      <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">
            Workspace Info
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {editingId === 'workspace' ? (
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={handleUpdateWorkspace}
                  className="inline-flex items-center p-2 text-green-600 hover:bg-green-50 rounded-md"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setWorkspaceName(activeWorkspace.name);
                  }}
                  className="inline-flex items-center p-2 text-gray-400 hover:bg-gray-50 rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Workspace Name
                  </label>
                  <p className="text-xl font-medium text-gray-900">
                    {activeWorkspace.name}
                  </p>
                </div>
                <button
                  onClick={() => setEditingId('workspace')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit2 className="h-4 w-4 mr-2" /> Rename
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Member Management Section */}
      <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Members</h2>
          </div>
          <button
            onClick={() => setEditingId('invite')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="mr-1 h-4 w-4" /> Invite User
          </button>
        </div>
        <div className="p-6">
          {editingId === 'invite' && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center">
                  <Mail className="h-4 w-4 mr-2" /> Invite New Member
                </h3>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as WorkspaceRole)
                    }
                  >
                    <option value={WorkspaceRole.MEMBER}>Member</option>
                    <option value={WorkspaceRole.ADMIN}>Admin</option>
                    <option value={WorkspaceRole.VIEWER}>Viewer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleInviteUser}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fullWorkspace.members?.map((member: any) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {member.user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.user?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 cursor-pointer hover:text-indigo-600"
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            member.userId,
                            e.target.value as WorkspaceRole,
                          )
                        }
                        disabled={member.role === WorkspaceRole.OWNER}
                      >
                        <option value={WorkspaceRole.OWNER} disabled>
                          Owner
                        </option>
                        <option value={WorkspaceRole.ADMIN}>Admin</option>
                        <option value={WorkspaceRole.MEMBER}>Member</option>
                        <option value={WorkspaceRole.VIEWER}>Viewer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.role !== WorkspaceRole.OWNER && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-400 hover:text-red-600 p-2"
                          title="Remove Member"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Project Stages Section */}
      <ProjectStagePage
        projectStages={projectStages}
        refetch={refetchProjectStages}
      />

      {/* Task Stages Section */}
      <TaskStagePage taskStages={taskStages} refetch={refetchTaskStages} />
    </div>
  );
}
