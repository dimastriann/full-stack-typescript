import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_CONVERSATION_MESSAGES,
  ADD_PARTICIPANT,
  REMOVE_PARTICIPANT,
  GET_MY_CONVERSATIONS,
  MARK_AS_READ,
} from '../gql/chat.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';
import type { Message, Conversation } from '../types';
import { socketService } from '../../../lib/socket';
import { useAuth } from '../../../context/AuthProvider';
import { Info, UserPlus, Trash2, Search, ArrowLeft } from 'lucide-react';
import Modal from '../../../components/Dialog';
import Linkify from 'linkify-react';
import LinkPreview from './LinkPreview';
import Logger from '../../../lib/logger';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export const ChatWindow = ({ conversation, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, loading } = useQuery(GET_CONVERSATION_MESSAGES, {
    variables: { conversationId: conversation.id },
    fetchPolicy: 'network-only',
  });

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: usersData } = useQuery(GET_USERS);
  const [addParticipant] = useMutation(ADD_PARTICIPANT, {
    refetchQueries: [GET_MY_CONVERSATIONS],
  });
  const [removeParticipant] = useMutation(REMOVE_PARTICIPANT, {
    refetchQueries: [GET_MY_CONVERSATIONS],
  });
  const [markAsRead] = useMutation(MARK_AS_READ, {
    refetchQueries: [GET_MY_CONVERSATIONS],
  });

  const handleAddMember = async (userId: number) => {
    try {
      await addParticipant({
        variables: { conversationId: conversation.id, userId },
      });
      setIsAddModalOpen(false);
      setSearchTerm('');
    } catch (err) {
      Logger.error('Failed to add member:', err);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await removeParticipant({
          variables: { conversationId: conversation.id, userId },
        });
      } catch (err) {
        Logger.error('Failed to remove member:', err);
      }
    }
  };

  const nonParticipants =
    usersData?.users
      .filter(
        (u: any) => !conversation.participants.some((p) => p.userId === u.id),
      )
      .filter(
        (u: any) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || [];

  useEffect(() => {
    if (data?.conversationMessages) {
      setMessages([...data.conversationMessages].reverse());
      // Mark as read when messages are loaded
      markAsRead({ variables: { conversationId: conversation.id } });
    }
  }, [data, conversation.id, markAsRead]);

  useEffect(() => {
    socketService.connect();
    socketService.emit('joinConversation', conversation.id);

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => [...prev, message]);
        // Auto-mark as read if the conversation is active
        markAsRead({ variables: { conversationId: conversation.id } });
      }
    };

    socketService.on('newMessage', handleNewMessage);

    return () => {
      socketService.off('newMessage', handleNewMessage);
    };
  }, [conversation.id, markAsRead]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socketService.emit('sendMessage', {
      conversationId: conversation.id,
      senderId: user.id,
      content: newMessage,
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1 text-gray-500 hover:bg-gray-200 rounded-full transition"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h3 className="font-semibold text-gray-800">
            {conversation.type === 'CHANNEL'
              ? `# ${conversation.name}`
              : conversation.participants.find((p) => p.userId !== user.id)
                  ?.user.name || 'Direct Chat'}
          </h3>
        </div>
        {conversation.type === 'CHANNEL' && (
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition"
            title="Channel Settings"
          >
            <Info size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="text-center text-gray-500">Loading messages...</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                msg.senderId === user.id
                  ? 'bg-indigo-300 text-neutral-800'
                  : 'bg-indigo-100 text-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="text-xs font-bold">
                  {msg.senderId === user.id ? 'You' : msg.sender.name}
                </div>
                <div className="text-[10px] opacity-70" title={new Date(msg.createdAt).toLocaleString()}>
                  {new Date(msg.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <div className="whitespace-pre-wrap">
                {msg.linkPreview && <LinkPreview preview={msg.linkPreview} />}
                <Linkify
                  options={{
                    target: '_blank',
                    className:
                      'underline hover:opacity-80 transition-opacity whitespace-pre-wrap',
                  }}
                >
                  {msg.content}
                </Linkify>
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-4 border-t border-gray-200 flex items-end gap-2"
      >
        <textarea
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as any);
            }
          }}
          placeholder="Type a message... (Shift + Enter for newline)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-y-auto min-h-[42px] max-h-[150px]"
          rows={1}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition h-[42px] flex-shrink-0"
        >
          Send
        </button>
      </form>

      {/* Info Modal */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Channel Details"
      >
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-700">Members</h4>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <UserPlus size={16} /> Add Member
              </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {conversation.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                      {p.user.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {p.user.name} {p.userId === user.id && '(You)'}
                      </div>
                    </div>
                  </div>
                  {p.userId !== user.id && (
                    <button
                      onClick={() => handleRemoveMember(p.userId)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSearchTerm('');
        }}
        title="Add member to channel"
      >
        <div className="space-y-4">
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
          <div className="max-h-60 overflow-y-auto space-y-2">
            {nonParticipants.map((u: any) => (
              <button
                key={u.id}
                onClick={() => handleAddMember(u.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition text-left"
              >
                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  {u.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm">
                    {u.name}
                  </div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
                <UserPlus size={18} className="text-indigo-600" />
              </button>
            ))}
            {nonParticipants.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No users found to add.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
