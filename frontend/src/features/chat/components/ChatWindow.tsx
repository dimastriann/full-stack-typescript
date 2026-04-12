import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_CONVERSATION_MESSAGES,
  ADD_PARTICIPANT,
  REMOVE_PARTICIPANT,
  GET_MY_CONVERSATIONS,
  MARK_AS_READ,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
} from '../gql/chat.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';
import { UPLOAD_FILE } from '../../attachments/gql/attachment.graphql';
import type { Message, Conversation } from '../types';
import { socketService } from '../../../lib/socket';
import { useAuth } from '../../../context/AuthProvider';
import {
  Info,
  UserPlus,
  Trash2,
  Search,
  ArrowLeft,
  Send,
  MoreVertical,
  Copy,
  Edit,
  Trash,
  File as FileIcon,
  MapPin,
  Smile,
  Download,
} from 'lucide-react';
import Modal from '../../../components/Dialog';
import Linkify from 'linkify-react';
import LinkPreview from './LinkPreview';
import Logger from '../../../lib/logger';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { useAttachments } from '../../attachments/hooks/useAttachments';
import DropDownChat, { type MenuItemData } from './DropDownChat';
import { LocationPickerModal } from './LocationPickerModal';
import { getAttachmentUrl } from '../../../config/api';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

interface StagedAttachment {
  localUrl: string;
  file: File;
  id?: number;
  status: 'uploading' | 'complete' | 'failed';
  filename: string;
  mimeType: string;
}

export const ChatWindow = ({ conversation, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMenuId, setShowMenuId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    StagedAttachment[]
  >([]);
  const [pendingLocation, setPendingLocation] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [updateMessage] = useMutation(UPDATE_MESSAGE);
  const [deleteMessage] = useMutation(DELETE_MESSAGE);
  const [uploadFile] = useMutation(UPLOAD_FILE);
  const { handlePreviewFile, handleDownloadFile } = useAttachments();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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

    const handleMessageUpdated = (message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m)),
        );
      }
    };

    const handleMessageDeleted = (data: {
      id: number;
      conversationId: number;
    }) => {
      if (data.conversationId === conversation.id) {
        setMessages((prev) => prev.filter((m) => m.id !== data.id));
      }
    };

    socketService.on('messageUpdated', handleMessageUpdated);
    socketService.on('messageDeleted', handleMessageDeleted);

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('messageUpdated', handleMessageUpdated);
      socketService.off('messageDeleted', handleMessageDeleted);
    };
  }, [conversation.id, markAsRead]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Message menu click outside - check the container, not just the trigger
      if (
        showMenuId &&
        !(event.target as Element).closest('.message-menu-container')
      ) {
        setShowMenuId(null);
      }

      // Emoji picker click outside
      if (
        showEmojiPicker &&
        !(event.target as Element).closest('.emoji-picker-container')
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuId, showEmojiPicker]);

  // Cleanup ObjectURLs to prevent memory leaks
  useEffect(() => {
    return () => {
      pendingAttachments.forEach((att) => URL.revokeObjectURL(att.localUrl));
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newMessage.trim() &&
      pendingAttachments.length === 0 &&
      !pendingLocation
    )
      return;

    // Only send attachments that have finished uploading
    const readyAttachments = pendingAttachments.filter(
      (a) => a.status === 'complete',
    );
    if (
      pendingAttachments.length > 0 &&
      readyAttachments.length < pendingAttachments.length
    ) {
      alert('Please wait for all files to finish uploading');
      return;
    }

    const attachmentIds = readyAttachments.map((a) => a.id!);
    let type = 'TEXT';
    if (pendingLocation) type = 'LOCATION';
    else if (readyAttachments.length > 0) {
      const first = readyAttachments[0];
      type = first.mimeType.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
    }

    socketService.emit('sendMessage', {
      conversationId: conversation.id,
      senderId: user.id,
      content: newMessage,
      type,
      attachmentIds,
      metadata: pendingLocation ? JSON.stringify(pendingLocation) : undefined,
    });

    setNewMessage('');
    // Clean up local URLs
    pendingAttachments.forEach((a) => URL.revokeObjectURL(a.localUrl));
    setPendingAttachments([]);
    setPendingLocation(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Process each file
    files.forEach(async (file) => {
      const localUrl = URL.createObjectURL(file);
      const newStaged: StagedAttachment = {
        localUrl,
        file,
        status: 'uploading',
        filename: file.name,
        mimeType: file.type,
      };

      setPendingAttachments((prev) => [...prev, newStaged]);

      try {
        const { data: uploadData } = await uploadFile({
          variables: {
            file,
            relationId: conversation.id,
            relationType: 'message',
          },
        });

        if (uploadData?.uploadFile) {
          setPendingAttachments((prev) =>
            prev.map((att) =>
              att.localUrl === localUrl
                ? { ...att, id: uploadData.uploadFile.id, status: 'complete' }
                : att,
            ),
          );
        }
      } catch (err) {
        Logger.error('Upload failed:', err);
        setPendingAttachments((prev) =>
          prev.map((att) =>
            att.localUrl === localUrl ? { ...att, status: 'failed' } : att,
          ),
        );
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLocationShare = () => {
    setIsLocationModalOpen(true);
  };

  const handleLocationSelect = (loc: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    setPendingLocation(loc);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const isToday = (date: string) => {
    const today = new Date();
    const messageDate = new Date(date);
    return today.toDateString() === messageDate.toDateString();
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setShowMenuId(null);
  };

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
    setShowMenuId(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      await updateMessage({
        variables: { id: editingMessageId, content: editContent },
      });

      socketService.emit('updateMessage', {
        id: editingMessageId,
        conversationId: conversation.id,
        senderId: user.id,
        content: editContent,
      });

      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      Logger.error('Failed to update message:', err);
    }
  };

  const handleMsgDelete = async (messageId: number) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        // Optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        setShowMenuId(null);

        await deleteMessage({ variables: { id: messageId } });

        socketService.emit('deleteMessage', {
          id: messageId,
          conversationId: conversation.id,
          senderId: user.id,
        });
      } catch (err) {
        Logger.error('Failed to delete message:', err);
        // Revert of deleted if failed? Maybe reload messages.
        alert('Failed to delete message');
      }
    }
  };

  const chatMenus: MenuItemData[] = [
    {
      title: 'Send Location',
      icon: <MapPin size={20} />,
      onClick: () => handleLocationShare(),
    },
    {
      title: 'Send File',
      icon: <FileIcon size={20} />,
      onClick: () => {
        Logger.info('Triggering file picker');
        setTimeout(() => fileInputRef.current?.click(), 0);
      },
    },
  ];

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
            className={`flex group ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 shadow-lg relative ${
                msg.senderId === user.id
                  ? 'bg-indigo-300 text-neutral-800'
                  : 'bg-indigo-100 text-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold">
                    {msg.senderId === user.id ? 'You' : msg.sender.name}
                  </div>
                  <div
                    className="text-[10px] opacity-70"
                    title={new Date(msg.createdAt).toLocaleString()}
                  >
                    {isToday(msg.createdAt)
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : new Date(msg.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                  </div>
                  {msg.isEdited && (
                    <div className="text-[10px] opacity-50 italic">
                      (edited)
                    </div>
                  )}
                </div>

                <div className="relative message-menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenuId(showMenuId === msg.id ? null : msg.id);
                    }}
                    className="p-1 text-gray-500 hover:bg-gray-200 rounded-full transition opacity-0 group-hover:opacity-100 message-menu-trigger"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {showMenuId === msg.id && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-10 py-1">
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="w-full px-3 py-1.5 text-xs text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Copy size={12} /> Copy
                      </button>
                      {msg.senderId === user.id && (
                        <>
                          <button
                            onClick={() => startEditing(msg)}
                            className="w-full px-3 py-1.5 text-xs text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleMsgDelete(msg.id)}
                            className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash size={12} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {editingMessageId === msg.id ? (
                <form onSubmit={handleUpdate} className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border border-indigo-400 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingMessageId(null)}
                      className="text-[10px] text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  {/* Multi-attachment Rendering */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mt-1">
                      {msg.attachments.map((att: any) => {
                        const isImage = att.mimeType.startsWith('image/');
                        return (
                          <div
                            key={att.id}
                            className="rounded-lg overflow-hidden border border-gray-200 bg-white/50 p-1"
                          >
                            {isImage ? (
                              <img
                                src={getAttachmentUrl(att.id)}
                                alt={att.filename}
                                className="max-h-[300px] w-auto object-contain cursor-pointer"
                                onClick={() => handlePreviewFile(att)}
                                onError={() => {
                                  Logger.warn(
                                    'Legacy image path failed, using hook for preview',
                                  );
                                }}
                              />
                            ) : (
                              <div className="flex items-center gap-3 p-2">
                                <FileIcon
                                  size={20}
                                  className="text-indigo-600"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate italic underline">
                                    {att.filename}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownloadFile(att)}
                                  className="p-1 hover:bg-gray-200 rounded-full transition"
                                  title="Download"
                                >
                                  <Download
                                    size={16}
                                    className="text-indigo-600"
                                  />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.type === 'LOCATION' && msg.metadata && (
                    <div className="p-3 bg-white/50 rounded-lg border border-gray-200 mt-1">
                      <div className="flex items-center gap-2 text-indigo-600 font-medium mb-1">
                        <MapPin size={18} />
                        <span className="text-xs">Shared Location</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${JSON.parse(msg.metadata).latitude},${JSON.parse(msg.metadata).longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 underline"
                      >
                        {JSON.parse(msg.metadata).address ||
                          'View on Google Maps'}
                      </a>
                    </div>
                  )}

                  {msg.content && (
                    <div className="whitespace-pre-wrap">
                      {msg.linkPreview && (
                        <LinkPreview preview={msg.linkPreview} />
                      )}
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
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Staging Bar */}
      {(pendingAttachments.length > 0 || pendingLocation) && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-2 items-center">
          {pendingAttachments.map((att, index) => (
            <div
              key={index}
              className="relative group p-2 bg-white rounded border border-gray-200 flex items-center gap-2 shadow-sm"
            >
              {att.mimeType.startsWith('image/') ? (
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  <img
                    src={att.localUrl}
                    alt=""
                    className={`object-cover w-full h-full ${att.status === 'uploading' ? 'opacity-50' : ''}`}
                  />
                  {att.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <FileIcon
                    size={20}
                    className={
                      att.status === 'uploading'
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }
                  />
                  {att.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin scale-50"></div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-xs truncate max-w-[100px] ${att.status === 'failed' ? 'text-red-500' : ''}`}
                >
                  {att.filename}
                </span>
                {att.status === 'failed' && (
                  <span className="text-[8px] text-red-500">Failed</span>
                )}
              </div>
              <button
                onClick={() => {
                  URL.revokeObjectURL(att.localUrl);
                  setPendingAttachments((prev) =>
                    prev.filter((_, i) => i !== index),
                  );
                }}
                className="p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition absolute -top-1 -right-1"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          {pendingLocation && (
            <div className="relative group p-2 bg-indigo-50 rounded border border-indigo-200 flex items-center gap-2 shadow-sm">
              <MapPin size={20} className="text-indigo-500" />
              <span className="text-xs">Location selected</span>
              <button
                onClick={() => setPendingLocation(null)}
                className="p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition absolute -top-1 -right-1"
              >
                <Trash2 size={10} />
              </button>
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="p-4 border-t border-gray-200 flex items-end gap-2"
      >
        <div className="relative emoji-picker-container">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            title="Emoji"
          >
            <Smile size={20} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 right-0 z-50 shadow-2xl rounded-lg overflow-hidden border border-gray-200">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                autoFocusSearch={false}
              />
            </div>
          )}
        </div>

        <DropDownChat menuItems={chatMenus} />

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
          placeholder={
            pendingAttachments.some((a) => a.status === 'uploading')
              ? 'Uploading files...'
              : 'Type a message... (Shift + Enter for newline)'
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-y-auto min-h-[42px] max-h-[150px] disabled:bg-gray-50"
          rows={1}
        />
        <button
          type="submit"
          disabled={
            (!newMessage.trim() &&
              pendingAttachments.length === 0 &&
              !pendingLocation) ||
            pendingAttachments.some((a) => a.status === 'uploading')
          }
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition h-[42px] flex-shrink-0 disabled:opacity-50"
        >
          <Send size={20} />
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
                      {p.user?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {p.user?.name || 'Unknown User'}{' '}
                        {p.userId === user?.id && '(You)'}
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

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={handleLocationSelect}
      />

      {/* Isolated Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
    </div>
  );
};
