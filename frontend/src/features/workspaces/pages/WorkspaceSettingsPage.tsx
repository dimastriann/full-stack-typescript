import { useState, useEffect } from 'react';
import Logger from '../../../lib/logger';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECT_STAGES } from '../../projects/gql/project.graphql';
import { GET_TASK_STAGES } from '../../tasks/gql/task.graphql';
import { GET_ME } from '../../auth/gql/auth.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';
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
import type { WorkspaceMember } from '../../../types/Workspaces';
import type { UserType } from '../../../types/Users';
import ProjectStagePage from './ProjectStagePage';
import TaskStagePage from './TaskStagePage';
import CustomFieldDefinitionPage from './CustomFieldDefinitionPage';
import Select from '../../../components/Select';
import ActivityLogFeed from '../../../components/dashboard/ActivityLogFeed';

import { useWorkspaceStore } from '../../../store/workspaceStore';

export default function WorkspaceSettingsPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const setActiveWorkspace = useWorkspaceStore(
    (state) => state.setActiveWorkspace,
  );
  const [editingId, setEditingId] = useState<
    number | 'new' | 'workspace' | 'invite' | null
  >(null);

  const [activeTab, setActiveTab] = useState<
    'info' | 'members' | 'stages' | 'activity' | 'custom-fields'
  >('info');

  // Workspace name editing state
  const [workspaceName, setWorkspaceName] = useState(
    activeWorkspace?.name || '',
  );

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  const { data: usersData } = useQuery(GET_USERS);
  const allUsers = usersData?.users || [];
  const filteredUsers = inviteEmail.trim()
    ? allUsers
        .filter(
          (u: UserType) =>
            u.email.toLowerCase().includes(inviteEmail.toLowerCase()) ||
            u.name.toLowerCase().includes(inviteEmail.toLowerCase()),
        )
        .slice(0, 5) // Limit suggestions to 5
    : [];

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
      Logger.error(err as string);
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
    } catch (err) {
      const error = err as Error;
      Logger.error(error.message || 'Failed to invite user');
      alert(error.message || 'Failed to invite user');
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
    } catch (err) {
      const error = err as Error;
      Logger.error(error.message || 'Failed to update role');
      alert(error.message || 'Failed to update role');
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
    } catch (err) {
      const error = err as Error;
      Logger.error(error.message || 'Failed to remove member');
      alert(error.message || 'Failed to remove member');
    }
  };

  if (!activeWorkspace)
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">
        Please select a workspace
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Workspace Settings
        </h1>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex border-b border-surface-200 dark:border-slate-800 mb-8 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Members ({fullWorkspace.members?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'stages'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Stages
        </button>
        <button
          onClick={() => setActiveTab('custom-fields')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'custom-fields'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Custom Fields
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'activity'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Activity Log
        </button>
      </div>

      {activeTab === 'info' && (
        /* Workspace Info Section */
        <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl mb-8 overflow-hidden border border-surface-200 dark:border-slate-800 animate-fade-in">
          <div className="p-6 border-b border-surface-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-900/50 flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Workspace Info
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              {editingId === 'workspace' ? (
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    className="input-modern"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateWorkspace}
                    className="inline-flex items-center p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setWorkspaceName(activeWorkspace.name);
                    }}
                    className="inline-flex items-center p-2 text-gray-400 hover:bg-surface-50 dark:hover:bg-slate-800 rounded-xl"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label-modern">Workspace Name</label>
                    <p className="text-xl font-medium text-gray-900 dark:text-white">
                      {activeWorkspace.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingId('workspace')}
                    className="inline-flex items-center px-4 py-2 border border-surface-200 dark:border-slate-800 shadow-sm text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-surface-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 mr-2" /> Rename
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        /* Member Management Section */
        <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl mb-8 overflow-hidden border border-surface-200 dark:border-slate-800 animate-fade-in">
          <div className="p-6 border-b border-surface-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Members
              </h2>
            </div>
            <button
              onClick={() => setEditingId('invite')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow transition-all"
            >
              <Plus className="mr-1 h-4 w-4" /> Invite User
            </button>
          </div>
          <div className="p-6">
            {editingId === 'invite' && (
              <div className="mb-6 p-6 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 space-y-4 animate-slide-in-up">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary-900 dark:text-primary-300 flex items-center">
                    <Mail className="h-4 w-4 mr-2" /> Invite New Member
                  </h3>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="label-modern">Email Address</label>
                    <input
                      type="email"
                      className="input-modern"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      placeholder="Search name or user@example.com"
                    />
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && filteredUsers.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 shadow-float rounded-xl border border-surface-200 dark:border-slate-800 max-h-60 overflow-y-auto overflow-x-hidden">
                        {filteredUsers.map((u: UserType) => (
                          <div
                            key={u.id}
                            className="px-4 py-3 hover:bg-primary-50 dark:hover:bg-slate-800 cursor-pointer flex flex-col border-b border-surface-100 dark:border-slate-800 last:border-0 transition-colors"
                            onClick={() => {
                              setInviteEmail(u.email);
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {u.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {u.email}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label-modern">Role</label>
                    <Select
                      value={inviteRole}
                      onChange={(val) => setInviteRole(val as WorkspaceRole)}
                      options={[
                        { id: WorkspaceRole.MEMBER, label: 'Member' },
                        { id: WorkspaceRole.ADMIN, label: 'Admin' },
                        { id: WorkspaceRole.VIEWER, label: 'Viewer' },
                      ]}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleInviteUser}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow transition-all"
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-200 dark:divide-slate-800">
                <thead className="bg-surface-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      Role
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-surface-200 dark:divide-slate-800">
                  {fullWorkspace.members?.map((member: WorkspaceMember) => (
                    <tr
                      key={member.id}
                      className="hover:bg-surface-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">
                            {member.user?.name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {member.user?.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {member.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.role === WorkspaceRole.OWNER ? (
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400 px-3">
                            Owner
                          </span>
                        ) : (
                          <Select
                            value={member.role}
                            onChange={(val) =>
                              handleUpdateRole(
                                member.userId,
                                val as WorkspaceRole,
                              )
                            }
                            options={[
                              { id: WorkspaceRole.ADMIN, label: 'Admin' },
                              { id: WorkspaceRole.MEMBER, label: 'Member' },
                              { id: WorkspaceRole.VIEWER, label: 'Viewer' },
                            ]}
                            className="w-32"
                          />
                        )}
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
      )}

      {activeTab === 'stages' && (
        <div className="space-y-8 animate-fade-in">
          {/* Project Stages Section */}
          <ProjectStagePage
            projectStages={projectStages}
            refetch={refetchProjectStages}
          />

          {/* Task Stages Section */}
          <TaskStagePage taskStages={taskStages} refetch={refetchTaskStages} />
        </div>
      )}

      {activeTab === 'custom-fields' && <CustomFieldDefinitionPage />}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl p-6 border border-surface-200 dark:border-slate-800 animate-fade-in">
          <ActivityLogFeed workspaceId={activeWorkspace.id} />
        </div>
      )}
    </div>
  );
}
