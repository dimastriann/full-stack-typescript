import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import Logger from '../../lib/logger';
import { CREATE_COMMENT } from '../../features/comments/gql/comment.graphql';
import { useAuthStore } from '../../store/authStore';
import { Send, CornerDownRight, MessageSquare } from 'lucide-react';

interface User {
  id: number;
  name: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: User;
  replies?: Comment[];
}

interface CommentThreadProps {
  comments: Comment[];
  projectId?: number;
  taskId?: number;
  refetch: () => void;
}

const getInitials = (name: string) => {
  return name.charAt(0).toUpperCase();
};

const CommentItem = ({
  comment,
  projectId,
  taskId,
  refetch,
  depth = 0,
  currentUser,
}: {
  comment: Comment;
  projectId?: number;
  taskId?: number;
  refetch: () => void;
  depth?: number;
  currentUser: User | null;
}) => {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [createComment, { loading }] = useMutation(CREATE_COMMENT);

  const isMine = currentUser?.id === comment.user.id;
  const isReply = depth > 0;

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await createComment({
        variables: {
          createCommentInput: {
            content: replyContent,
            userId: currentUser?.id,
            projectId,
            taskId,
            parentId: comment.id,
          },
        },
      });
      setReplyContent('');
      setShowReply(false);
      refetch();
    } catch (e) {
      Logger.error(e as string);
      alert('Failed to post reply');
    }
  };

  return (
    <div className={`flex flex-col mb-4 ${isReply ? 'ml-8 mt-2' : ''}`}>
      <div className={`flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-colors
          ${isMine ? 'bg-primary-600' : 'bg-surface-300 dark:bg-slate-700'}
        `}
        >
          {getInitials(comment.user.name)}
        </div>

        {/* Comment Content */}
        <div
          className={`flex flex-col max-w-[85%] ${isMine ? 'items-end' : 'items-start'}`}
        >
          <div className="flex items-baseline gap-2 mb-1 px-1">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors">
              {isMine ? 'You' : comment.user.name}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              {new Date(comment.createdAt).toLocaleDateString()}{' '}
              {new Date(comment.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div
            className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm relative group transition-all
            ${
              isMine
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-surface-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-tl-sm border border-surface-200 dark:border-slate-700'
            }
          `}
          >
            <p className="whitespace-pre-wrap break-words">{comment.content}</p>

            {/* Reply Button (Only show on hover, and usually only useful on root comments or 1-level deep) */}
            {depth < 2 && (
              <button
                onClick={() => setShowReply(!showReply)}
                className={`absolute ${isMine ? '-left-9' : '-right-9'} top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 text-gray-400 dark:text-gray-500 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:text-primary-600 dark:hover:text-primary-400 transform hover:scale-110 active:scale-95`}
                title="Reply"
              >
                <CornerDownRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input Box */}
      {showReply && (
        <div
          className={`mt-2 flex gap-2 ${isMine ? 'justify-end pr-11' : 'pl-11'}`}
        >
          <div className="flex-1 max-w-[80%] relative">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.user.name}...`}
              className="w-full text-sm rounded-xl border border-surface-200 dark:border-slate-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-10 resize-none shadow-sm text-gray-900 dark:text-white transition-colors"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <button
              onClick={handleReply}
              disabled={loading || !replyContent.trim()}
              className="absolute right-2 bottom-2 p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              projectId={projectId}
              taskId={taskId}
              refetch={refetch}
              depth={depth + 1}
              currentUser={currentUser as any}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  projectId,
  taskId,
  refetch,
}) => {
  const [newComment, setNewComment] = useState('');
  const [createComment, { loading }] = useMutation(CREATE_COMMENT);
  const currentUser = useAuthStore((state) => state.user);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment({
        variables: {
          createCommentInput: {
            content: newComment,
            userId: currentUser?.id,
            projectId,
            taskId,
          },
        },
      });
      setNewComment('');
      refetch();
    } catch (e) {
      Logger.error(e as string);
      alert('Failed to post comment');
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-2 no-scrollbar">
        {!comments || comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 p-8 animate-fade-in">
            <div className="w-16 h-16 bg-surface-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 transition-colors">
              <MessageSquare
                size={32}
                className="text-surface-300 dark:text-slate-600"
              />
            </div>
            <p className="text-base font-black text-gray-900 dark:text-white mb-1 transition-colors">
              No comments yet
            </p>
            <p className="text-xs font-medium uppercase tracking-wider">
              Be the first to start the conversation
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              projectId={projectId}
              taskId={taskId}
              refetch={refetch}
              currentUser={currentUser as any}
            />
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="mt-auto pt-4 border-t border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full text-sm rounded-xl border border-surface-200 dark:border-slate-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 bg-surface-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 py-3.5 pl-4 pr-12 resize-none shadow-inner transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
            />
          </div>
          <button
            onClick={handlePostComment}
            disabled={loading || !newComment.trim()}
            className="flex-shrink-0 h-[48px] w-[48px] rounded-xl bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-90"
            title="Post Comment"
          >
            <Send size={20} className={loading ? 'animate-pulse' : ''} />
          </button>
        </div>
        <div className="mt-3 text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium uppercase tracking-widest transition-colors">
          Press{' '}
          <kbd className="px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 font-black text-gray-600 dark:text-gray-400">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 font-black text-gray-600 dark:text-gray-400">
            Shift + Enter
          </kbd>{' '}
          for new line
        </div>
      </div>
    </div>
  );
};
