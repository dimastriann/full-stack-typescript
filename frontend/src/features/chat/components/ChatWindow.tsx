import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_CONVERSATION_MESSAGES,
  ADD_PARTICIPANT,
  REMOVE_PARTICIPANT,
  GET_MY_CONVERSATIONS,
  MARK_AS_READ,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
  SEND_MESSAGE,
  MESSAGE_SENT_SUBSCRIPTION,
  MESSAGE_UPDATED_SUBSCRIPTION,
  MESSAGE_DELETED_SUBSCRIPTION,
} from '../gql/chat.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';
import { UPLOAD_FILE } from '../../attachments/gql/attachment.graphql';
import type { Message, Conversation } from '../types';
import type { UserType } from '../../../types/Users';
import { useAuthStore } from '../../../store/authStore';
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
  X,
} from 'lucide-react';
import Modal from '../../../components/Dialog';
import Linkify from 'linkify-react';
import LinkPreview from './LinkPreview';
import Logger from '../../../lib/logger';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import { useAttachments } from '../../attachments/hooks/useAttachments';
import DropDownChat, { type MenuItemData } from './DropDownChat';
import { LocationPickerModal } from './LocationPickerModal';
import { getAttachmentUrl } from '../../../config/api';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
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
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMenuId, setShowMenuId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    StagedAttachment[]
  >([]);
  const [pendingLocation, setPendingLocation] = useState<LocationData | null>(
    null,
  );
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
  const [sendMessage] = useMutation(SEND_MESSAGE);
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
        (u: UserType) =>
          !conversation.participants.some((p) => p.userId === u.id),
      )
      .filter(
        (u: UserType) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || [];

  useEffect(() => {
    if (data?.conversationMessages) {
      const sorted = [...data.conversationMessages].sort((a, b) => a.id - b.id);
      setMessages(sorted);
      // Mark as read when messages are loaded
      markAsRead({ variables: { conversationId: conversation.id } });
    }
  }, [data, conversation.id, markAsRead]);

  useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    variables: { conversationId: conversation.id },
    onData: ({ data }) => {
      const msg = data.data?.messageSent;
      if (msg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg].sort((a, b) => a.id - b.id);
        });
        markAsRead({ variables: { conversationId: conversation.id } });
      }
    },
  });

  useSubscription(MESSAGE_UPDATED_SUBSCRIPTION, {
    variables: { conversationId: conversation.id },
    onData: ({ data }) => {
      const msg = data.data?.messageUpdated;
      if (msg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? msg : m)),
        );
      }
    },
  });

  useSubscription(MESSAGE_DELETED_SUBSCRIPTION, {
    variables: { conversationId: conversation.id },
    onData: ({ data }) => {
      const deletedId = data.data?.messageDeleted;
      if (deletedId !== undefined) {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      }
    },
  });

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
  }, [pendingAttachments]);

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

    sendMessage({
      variables: {
        conversationId: conversation.id,
        content: newMessage,
        type,
        attachmentIds,
        metadata: pendingLocation ? JSON.stringify(pendingLocation) : undefined,
      },
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

  const handleLocationSelect = (loc: LocationData) => {
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-surface-200 dark:border-slate-800 transition-colors overflow-hidden">
      <div className="p-4 border-b border-surface-200 dark:border-slate-800 flex justify-between items-center bg-surface-50 dark:bg-slate-900/50 transition-colors">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1 text-gray-500 dark:text-gray-400 hover:bg-surface-200 dark:hover:bg-slate-800 rounded-full transition"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">
            {conversation.type === 'CHANNEL'
              ? `# ${conversation.name}`
              : conversation.participants.find((p) => p.userId !== user?.id)
                  ?.user.name || 'Direct Chat'}
          </h3>
        </div>
        {conversation.type === 'CHANNEL' && (
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-surface-200 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Channel Settings"
          >
            <Info size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium animate-pulse">
              Loading messages...
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex group ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md relative transition-all ${
                msg.senderId === user?.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 dark:bg-slate-800 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-90">
                    {msg.senderId === user?.id ? 'You' : msg.sender.name}
                  </div>
                  <div
                    className="text-[10px] opacity-60 font-medium"
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
                    className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 message-menu-trigger ${
                      msg.senderId === user?.id
                        ? 'text-white/70 hover:bg-white/20'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-surface-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <MoreVertical size={14} />
                  </button>

                  {showMenuId === msg.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-xl shadow-float z-10 py-1.5 overflow-hidden animate-fade-in">
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="w-full px-4 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                      >
                        <Copy size={14} /> Copy
                      </button>
                      {msg.senderId === user?.id && (
                        <>
                          <button
                            onClick={() => startEditing(msg)}
                            className="w-full px-4 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleMsgDelete(msg.id)}
                            className="w-full px-4 py-2 text-xs font-bold text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors border-t border-surface-100 dark:border-slate-800 mt-1"
                          >
                            <Trash size={14} /> Delete
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
                    className="input-modern w-full p-3 text-sm min-h-[80px]"
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
                      className="text-xs text-white hover:text-white font-black uppercase tracking-widest bg-primary-700 dark:bg-primary-500 px-3 py-1 rounded-lg transition-all shadow-sm"
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
                      {msg.attachments.map((att) => {
                        const isImage = att.mimeType.startsWith('image/');
                        return (
                          <div
                            key={att.id}
                            className="rounded-xl overflow-hidden border border-surface-200/50 dark:border-slate-700/50 bg-white/10 p-1 group/att"
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
                                  className="p-2 hover:bg-white/20 rounded-xl transition-all"
                                  title="Download"
                                >
                                  <Download
                                    size={16}
                                    className={
                                      msg.senderId === user?.id
                                        ? 'text-white'
                                        : 'text-primary-600 dark:text-primary-400'
                                    }
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
                    <div className="p-3 bg-white/10 rounded-xl border border-white/10 mt-1">
                      <div
                        className={`flex items-center gap-2 font-bold mb-1 ${msg.senderId === user?.id ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`}
                      >
                        <MapPin size={18} />
                        <span className="text-xs uppercase tracking-wider">
                          Shared Location
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${JSON.parse(msg.metadata).latitude},${JSON.parse(msg.metadata).longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-[11px] font-bold underline decoration-2 underline-offset-2 ${msg.senderId === user?.id ? 'text-white/90 hover:text-white' : 'text-blue-600 dark:text-blue-400'}`}
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
        <div className="px-4 py-3 border-t border-surface-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-900/50 flex flex-wrap gap-3 items-center transition-colors">
          {pendingAttachments.map((att, index) => (
            <div
              key={index}
              className="relative group p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-surface-200 dark:border-slate-700 flex items-center gap-3 shadow-md animate-slide-in-up"
            >
              {att.mimeType.startsWith('image/') ? (
                <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden relative border border-surface-100 dark:border-slate-800">
                  <img
                    src={att.localUrl}
                    alt=""
                    className={`object-cover w-full h-full ${att.status === 'uploading' ? 'opacity-50' : ''}`}
                  />
                  {att.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <FileIcon
                    size={24}
                    className={
                      att.status === 'uploading'
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-primary-600 dark:text-primary-400'
                    }
                  />
                  {att.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col min-w-0 pr-4">
                <span
                  className={`text-xs font-bold truncate max-w-[120px] ${att.status === 'failed' ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
                >
                  {att.filename}
                </span>
                {att.status === 'failed' && (
                  <span className="text-[10px] font-bold text-red-500 uppercase">
                    Failed
                  </span>
                )}
                {att.status === 'uploading' && (
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase animate-pulse">
                    Uploading...
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  URL.revokeObjectURL(att.localUrl);
                  setPendingAttachments((prev) =>
                    prev.filter((_, i) => i !== index),
                  );
                }}
                className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all absolute -top-2 -right-2 z-10"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {pendingLocation && (
            <div className="relative group p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 flex items-center gap-3 shadow-md animate-slide-in-up">
              <div className="p-2 bg-primary-600 text-white rounded-lg">
                <MapPin size={24} />
              </div>
              <div className="flex flex-col pr-4">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  Location sharing
                </span>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coordinates ready
                </span>
              </div>
              <button
                onClick={() => setPendingLocation(null)}
                className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all absolute -top-2 -right-2 z-10"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="p-4 border-t border-surface-200 dark:border-slate-800 flex items-end gap-3 bg-white dark:bg-slate-900 transition-colors"
      >
        <div className="relative emoji-picker-container">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Emoji"
          >
            <Smile size={22} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-4 right-0 z-50 shadow-float rounded-2xl overflow-hidden border border-surface-200 dark:border-slate-800 animate-slide-in-up">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                autoFocusSearch={false}
                theme={
                  document.documentElement.classList.contains('dark')
                    ? Theme.DARK
                    : Theme.LIGHT
                }
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
              handleSend(e as unknown as React.FormEvent);
            }
          }}
          placeholder={
            pendingAttachments.some((a) => a.status === 'uploading')
              ? 'Uploading files...'
              : 'Type a message...'
          }
          className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 resize-none overflow-y-auto min-h-[46px] max-h-[150px] disabled:opacity-50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all no-scrollbar"
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
          className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl shadow-md hover:shadow-lg transition-all flex-shrink-0 disabled:opacity-50 disabled:scale-95 transform active:scale-90"
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
                    <div className="h-8 w-8 rounded-full bg-surface-200 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-xs">
                      {p.user?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {p.user?.name} {p.userId === user?.id && '(You)'}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider font-medium">
                        Member
                      </div>
                    </div>
                  </div>
                  {p.userId !== user?.id && (
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
              className="input-modern pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {nonParticipants.map((u: any) => (
              <button
                key={u.id}
                onClick={() => handleAddMember(u.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-slate-800 rounded-xl transition-all text-left group"
              >
                <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  {u.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                    {u.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {u.email}
                  </div>
                </div>
                <UserPlus
                  size={18}
                  className="text-primary-600 dark:text-primary-400"
                />
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
