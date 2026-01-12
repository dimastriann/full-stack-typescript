import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { User, UserPlus, Trash2 } from 'lucide-react';
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
      console.error(err);
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
      console.error(err);
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
      console.error(err);
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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <User className="mr-2 h-5 w-5 text-indigo-500" />
          Members
        </h3>
        {canManage && (
          <button
            onClick={() => setIsInviteOpen(!isInviteOpen)}
            className="p-1 rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Invite Member"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        )}
      </div>

      {isInviteOpen && (
        <form
          onSubmit={handleInvite}
          className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">
                Email Address
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-2 py-1"
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Invite
              </button>
            </div>
          </div>
        </form>
      )}

      <ul className="divide-y divide-gray-200">
        {members.map((member: any) => (
          <li key={member.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {member.user.firstName?.[0] ||
                      member.user.email[0].toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {member.user.firstName} {member.user.lastName}
                    {parseInt(member.user.id) === currentUserId && (
                      <span className="ml-2 text-xs text-indigo-600 font-semibold">
                        (You)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                {canManage && parseInt(member.user.id) !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleUpdateRole(parseInt(member.user.id), e.target.value)
                    }
                    className="text-xs border-none bg-transparent focus:ring-0 text-gray-600 cursor-pointer hover:text-indigo-600"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                ) : (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      member.role === 'OWNER'
                        ? 'bg-purple-100 text-purple-700'
                        : member.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-700'
                          : member.role === 'MEMBER'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
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
                      className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
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
