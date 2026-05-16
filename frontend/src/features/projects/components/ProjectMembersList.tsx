import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { User, UserPlus, Trash2 } from 'lucide-react';
import Logger from '../../../lib/logger';
import {
  GET_PROJECT_MEMBERS,
  INVITE_TO_PROJECT,
  REMOVE_MEMBER,
  UPDATE_MEMBER_ROLE,
} from '../gql/project-member.graphql';

interface ProjectMembersListProps {
  projectId: number;
  currentUserId: number;
}

export default function ProjectMembersList({
  projectId,
  currentUserId,
}: ProjectMembersListProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const { data, loading, refetch } = useQuery(GET_PROJECT_MEMBERS, {
    variables: { projectId },
    skip: !projectId,
  });

  const [inviteUser] = useMutation(INVITE_TO_PROJECT);
  const [removeMember] = useMutation(REMOVE_MEMBER);
  const [updateRole] = useMutation(UPDATE_MEMBER_ROLE);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser({
        variables: {
          input: {
            projectId,
            email: inviteEmail,
            role: inviteRole,
          },
        },
      });
      setInviteEmail('');
      setIsInviteOpen(false);
      refetch();
    } catch (err) {
      Logger.error(err as string);
      alert('Failed to invite user');
    }
  };

  const handleRemove = async (userId: number) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember({
        variables: {
          input: { projectId, userId },
        },
      });
      refetch();
    } catch (err) {
      Logger.error(err as string);
      alert('Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      await updateRole({
        variables: {
          input: { projectId, userId, role: newRole },
        },
      });
      refetch();
    } catch (err) {
      Logger.error(err as string);
      alert('Failed to update role');
    }
  };

  const members = data?.projectMembers || [];
  const currentUserMembership = members.find(
    (m: any) => parseInt(m.user.id) === currentUserId,
  );
  const canManage =
    currentUserMembership?.role === 'OWNER' ||
    currentUserMembership?.role === 'ADMIN';

  if (loading) return <div>Loading members...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl p-6 border border-surface-200 dark:border-slate-800 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <User className="mr-2.5 h-5 w-5 text-primary-500" />
          Members
        </h3>
        {canManage && (
          <button
            onClick={() => setIsInviteOpen(!isInviteOpen)}
            className="p-2 rounded-xl text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all shadow-sm"
            title="Invite Member"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        )}
      </div>

      {isInviteOpen && (
        <form
          onSubmit={handleInvite}
          className="mb-6 p-4 bg-surface-50 dark:bg-slate-800/50 rounded-xl border border-surface-200 dark:border-slate-700/50 animate-slide-in-down"
        >
          <div className="space-y-4">
            <div>
              <label className="label-modern mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="input-modern"
              />
            </div>
            <div>
              <label className="label-modern mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="select-modern"
              >
                <option value="ADMIN" className="dark:bg-slate-900">
                  Admin
                </option>
                <option value="MEMBER" className="dark:bg-slate-900">
                  Member
                </option>
                <option value="VIEWER" className="dark:bg-slate-900">
                  Viewer
                </option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-sm transition-all"
              >
                Invite Member
              </button>
            </div>
          </div>
        </form>
      )}

      <ul className="divide-y divide-surface-100 dark:divide-slate-800/50">
        {members.map((member: any) => (
          <li key={member.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-black text-sm shadow-inner">
                    {member.user.firstName?.[0] ||
                      member.user.email[0].toUpperCase()}
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {member.user.firstName} {member.user.lastName}
                    {parseInt(member.user.id) === currentUserId && (
                      <span className="text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {canManage && parseInt(member.user.id) !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleUpdateRole(parseInt(member.user.id), e.target.value)
                    }
                    className="text-xs border-none bg-transparent focus:ring-0 text-gray-600 dark:text-gray-400 font-bold cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <option value="OWNER" className="dark:bg-slate-900">
                      Owner
                    </option>
                    <option value="ADMIN" className="dark:bg-slate-900">
                      Admin
                    </option>
                    <option value="MEMBER" className="dark:bg-slate-900">
                      Member
                    </option>
                    <option value="VIEWER" className="dark:bg-slate-900">
                      Viewer
                    </option>
                  </select>
                ) : (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                      member.role === 'OWNER'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : member.role === 'ADMIN'
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          : member.role === 'MEMBER'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-surface-100 dark:bg-slate-800 text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {member.role}
                  </span>
                )}

                {canManage &&
                  parseInt(member.user.id) !== currentUserId &&
                  member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemove(parseInt(member.user.id))}
                      className="ml-3 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Remove Member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
