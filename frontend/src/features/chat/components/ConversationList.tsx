import type { Conversation, User } from '../types';
import { useAuthStore } from '../../../store/authStore';
import {
  Plus,
  Search,
  Trash2,
  Hash,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
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
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { Check, X as CloseIcon } from 'lucide-react';
import Logger from '../../../lib/logger';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: number;
  onSelect: (conv: Conversation) => void;
}

const ConversationItem = ({
  conv,
  selectedId,
  onSelect,
  onDelete,
  currentUserId,
}: {
  conv: Conversation;
  selectedId?: number;
  onSelect: (conv: Conversation) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  currentUserId?: number;
}) => {
  return (
    <button
      onClick={() => onSelect(conv)}
      className={`w-full text-left p-3 rounded-xl transition-all group relative flex flex-col gap-1.5 ${
        selectedId === conv.id
          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold shadow-sm'
          : 'hover:bg-surface-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400'
      }`}
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
          {conv.type === 'CHANNEL' ? (
            <Hash
              size={16}
              className="text-gray-400 dark:text-gray-500 flex-shrink-0"
            />
          ) : (
            <UserIcon
              size={16}
              className="text-gray-400 dark:text-gray-500 flex-shrink-0"
            />
          )}
          <span className="truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            {conv.type === 'CHANNEL'
              ? conv.name
              : conv.participants.find((p) => p.userId !== currentUserId)?.user
                  .name || 'Direct Chat'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {conv.unreadCount && conv.unreadCount > 0 ? (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {conv.unreadCount}
            </span>
          ) : null}
          <div
            onClick={(e) => onDelete(e, conv.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} />
          </div>
        </div>
      </div>
      {conv.messages && conv.messages[0] && (
        <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate w-full pl-6 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors">
          {conv.messages[0].content}
        </div>
      )}
    </button>
  );
};

export const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) => {
  const user = useAuthStore((state) => state.user);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'DM' | 'CHANNEL'>('DM');
  const [channelName, setChannelName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    channels: true,
    dms: true,
  });

  const channels = conversations.filter((c) => c.type === 'CHANNEL');
  const dms = conversations.filter((c) => c.type === 'DIRECT');

  const toggleSection = (section: 'channels' | 'dms') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
          onSelect(null as unknown as Conversation); // Clear selection if deleted
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
        u.id !== user?.id &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())),
    ) || [];

  return (
    <div className="w-full flex flex-col bg-surface-50 dark:bg-slate-950 h-full transition-colors">
      <div className="p-4 border-b border-surface-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10 min-h-[64px] transition-colors">
        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
          Discussions
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl transition-all"
          title="New Chat"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Channels Section */}
        <div>
          <button
            onClick={() => toggleSection('channels')}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest hover:bg-surface-100 dark:hover:bg-slate-800 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-1.5">
              {expandedSections.channels ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
              <span>Channels ({channels.length})</span>
            </div>
          </button>

          {expandedSections.channels && (
            <div className="mt-1 space-y-1">
              {channels.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onDelete={handleDeleteConversation}
                  currentUserId={user?.id}
                />
              ))}
              {channels.length === 0 && (
                <div className="px-6 py-2 text-xs text-gray-400 italic">
                  No channels found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div>
          <button
            onClick={() => toggleSection('dms')}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest hover:bg-surface-100 dark:hover:bg-slate-800 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-1.5">
              {expandedSections.dms ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
              <span>Direct Messages ({dms.length})</span>
            </div>
          </button>

          {expandedSections.dms && (
            <div className="mt-1 space-y-1">
              {dms.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onDelete={handleDeleteConversation}
                  currentUserId={user?.id}
                />
              ))}
              {dms.length === 0 && (
                <div className="px-6 py-2 text-xs text-gray-400 italic">
                  No direct messages
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'DM' ? 'Start a new message' : 'Create a channel'}
      >
        <div className="space-y-4">
          <div className="flex bg-surface-100 dark:bg-slate-800 p-1.5 rounded-xl transition-colors">
            <button
              onClick={() => setModalMode('DM')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                modalMode === 'DM'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Direct Message
            </button>
            <button
              onClick={() => setModalMode('CHANNEL')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                modalMode === 'CHANNEL'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Channel
            </button>
          </div>

          {modalMode === 'CHANNEL' && (
            <div>
              <label className="label-modern">Channel Name</label>
              <input
                type="text"
                placeholder="e.g. general-discussion"
                className="input-modern"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
          )}

          <div className="relative group">
            <Search
              className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-primary-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search people..."
              className="input-modern pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {modalMode === 'CHANNEL' && selectedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-surface-50 dark:bg-slate-800/50 rounded-xl border border-surface-200 dark:border-slate-800">
              {selectedUserIds.map((uid) => {
                const u = userData?.users.find((u: User) => u.id === uid);
                return (
                  <div
                    key={uid}
                    className="flex items-center gap-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2.5 py-1 rounded-full text-xs font-bold animate-fade-in"
                  >
                    {u?.name}
                    <button
                      onClick={() => toggleUserSelection(uid)}
                      className="hover:text-primary-900 dark:hover:text-white transition-colors"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2 no-scrollbar">
            {filteredUsers.map((u: UserType) => (
              <button
                key={u.id}
                onClick={() =>
                  modalMode === 'DM'
                    ? handleStartChat(u.id!)
                    : toggleUserSelection(u.id!)
                }
                className={`w-full flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-slate-800 rounded-xl transition-all text-left border ${
                  modalMode === 'CHANNEL' && selectedUserIds.includes(u.id!)
                    ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'
                    : 'border-transparent'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-black relative transition-colors">
                  {u.firstName?.[0] || u.name[0]}
                  {modalMode === 'CHANNEL' &&
                    selectedUserIds.includes(u.id!) && (
                      <div className="absolute -top-1 -right-1 bg-primary-600 text-white rounded-full p-0.5 shadow-md">
                        <Check size={10} />
                      </div>
                    )}
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white leading-tight">
                    {u.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {u.email}
                  </div>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-medium">
                No users found
              </div>
            )}
          </div>

          {modalMode === 'CHANNEL' && (
            <button
              onClick={handleCreateChannel}
              disabled={!channelName || selectedUserIds.length === 0}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              Create Channel
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};
