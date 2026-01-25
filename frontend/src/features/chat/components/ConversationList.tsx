import type { Conversation, User } from '../types';
import { useAuth } from '../../../context/AuthProvider';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USERS } from '../../users/gql/user.graphql';
import {
  CREATE_DIRECT_CONVERSATION,
  CREATE_CHANNEL,
  DELETE_CONVERSATION,
} from '../gql/chat.graphql';
import { useState } from 'react';
import Modal from '../../../components/Dialog';
import type { UserType } from '../../../types/Users';
import { useWorkspace } from '../../../context/WorkspaceProvider';
import { Check, X as CloseIcon } from 'lucide-react';
import Logger from '../../../lib/logger';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: number;
  onSelect: (conv: Conversation) => void;
}

export const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'DM' | 'CHANNEL'>('DM');
  const [channelName, setChannelName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: userData } = useQuery(GET_USERS);
  const [createDirectConversation] = useMutation(CREATE_DIRECT_CONVERSATION, {
    refetchQueries: ['GetMyConversations'],
  });
  const [createChannel] = useMutation(CREATE_CHANNEL, {
    refetchQueries: ['GetMyConversations'],
  });
  const [deleteConversation] = useMutation(DELETE_CONVERSATION, {
    refetchQueries: ['GetMyConversations'],
  });

  const handleStartChat = async (otherUserId: number) => {
    try {
      const { data } = await createDirectConversation({
        variables: { otherUserId },
      });
      if (data?.createDirectConversation) {
        onSelect(data.createDirectConversation);
        closeModal();
      }
    } catch (err) {
      Logger.error('Failed to start chat:', err);
    }
  };

  const handleCreateChannel = async () => {
    if (!activeWorkspace) {
      alert('Please select a workspace');
      return;
    }
    if (!channelName || selectedUserIds.length === 0) {
      alert('Please enter a channel name and select at least one user');
      return;
    }
    try {
      const { data } = await createChannel({
        variables: {
          name: channelName,
          workspaceId: activeWorkspace.id,
          userIds: selectedUserIds,
        },
      });
      if (data?.createChannel) {
        onSelect(data.createChannel);
        closeModal();
      }
    } catch (err) {
      Logger.error('Failed to create channel:', err);
    }
  };

  const toggleUserSelection = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    );
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation({ variables: { id } });
        if (selectedId === id) {
          onSelect(null as any); // Clear selection if deleted
        }
      } catch (err) {
        Logger.error('Failed to delete conversation:', err);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm('');
    setChannelName('');
    setSelectedUserIds([]);
    setModalMode('DM');
  };

  const filteredUsers =
    userData?.users.filter(
      (u: User) =>
        u.id !== user.id &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())),
    ) || [];

  return (
    <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50 h-full">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-gray-700">Discussions</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-full transition"
          title="New Chat"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="space-y-1 p-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full text-left p-3 rounded-lg transition group relative ${
              selectedId === conv.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm truncate flex-1">
                {conv.type === 'CHANNEL'
                  ? `# ${conv.name}`
                  : conv.participants.find((p) => p.userId !== user.id)?.user
                      .name || 'Direct Chat'}
              </div>
              <div
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
              >
                <Trash2 size={14} />
              </div>
            </div>
            {conv.messages && conv.messages[0] && (
              <div className="text-xs text-gray-400 truncate mt-1">
                {conv.messages[0].content}
              </div>
            )}
          </button>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'DM' ? 'Start a new message' : 'Create a channel'}
      >
        <div className="space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setModalMode('DM')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                modalMode === 'DM'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Direct Message
            </button>
            <button
              onClick={() => setModalMode('CHANNEL')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                modalMode === 'CHANNEL'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Channel
            </button>
          </div>

          {modalMode === 'CHANNEL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel Name
              </label>
              <input
                type="text"
                placeholder="e.g. general-discussion"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
          )}

          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search people..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {modalMode === 'CHANNEL' && selectedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUserIds.map((uid) => {
                const u = userData?.users.find((u: any) => u.id === uid);
                return (
                  <div
                    key={uid}
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {u?.name}
                    <button onClick={() => toggleUserSelection(uid)}>
                      <CloseIcon size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredUsers.map((u: UserType) => (
              <button
                key={u.id}
                onClick={() =>
                  modalMode === 'DM'
                    ? handleStartChat(u.id!)
                    : toggleUserSelection(u.id!)
                }
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition text-left ${
                  modalMode === 'CHANNEL' && selectedUserIds.includes(u.id!)
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'border border-transparent'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold relative">
                  {u.firstName?.[0] || u.name[0]}
                  {modalMode === 'CHANNEL' &&
                    selectedUserIds.includes(u.id!) && (
                      <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5">
                        <Check size={10} />
                      </div>
                    )}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No users found
              </div>
            )}
          </div>

          {modalMode === 'CHANNEL' && (
            <button
              onClick={handleCreateChannel}
              disabled={!channelName || selectedUserIds.length === 0}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              Create Channel
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};
