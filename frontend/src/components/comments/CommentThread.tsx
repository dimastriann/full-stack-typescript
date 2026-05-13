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
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
          ${isMine ? 'bg-primary-600' : 'bg-gray-400'}
        `}
        >
          {getInitials(comment.user.name)}
        </div>

        {/* Comment Content */}
        <div
          className={`flex flex-col max-w-[85%] ${isMine ? 'items-end' : 'items-start'}`}
        >
          <div className="flex items-baseline gap-2 mb-1 px-1">
            <span className="text-xs font-semibold text-gray-700">
              {isMine ? 'You' : comment.user.name}
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString()}{' '}
              {new Date(comment.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div
            className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm relative group
            ${
              isMine
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-surface-100 text-gray-800 rounded-tl-sm border border-surface-200'
            }
          `}
          >
            <p className="whitespace-pre-wrap break-words">{comment.content}</p>

            {/* Reply Button (Only show on hover, and usually only useful on root comments or 1-level deep) */}
            {depth < 2 && (
              <button
                onClick={() => setShowReply(!showReply)}
                className={`absolute ${isMine ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white border border-surface-200 text-gray-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary-600`}
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
              className="w-full text-sm rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white py-2 pl-3 pr-10 resize-none shadow-sm"
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
              className="absolute right-2 bottom-2 p-1 text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
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
              currentUser={currentUser}
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
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6">
            <MessageSquare size={32} className="mb-3 text-surface-300" />
            <p className="text-sm font-medium">No comments yet</p>
            <p className="text-xs">Be the first to start the conversation.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              projectId={projectId}
              taskId={taskId}
              refetch={refetch}
              currentUser={currentUser}
            />
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="mt-auto pt-4 border-t border-surface-200 bg-white">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full text-sm rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-surface-50 focus:bg-white py-3 pl-4 pr-12 resize-none shadow-inner transition-all duration-200"
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
            className="flex-shrink-0 h-[46px] w-[46px] rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Post Comment"
          >
            <Send size={18} className={loading ? 'animate-pulse' : ''} />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-gray-400 text-center">
          Press{' '}
          <kbd className="px-1 py-0.5 rounded bg-surface-100 border border-surface-200 font-sans">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="px-1 py-0.5 rounded bg-surface-100 border border-surface-200 font-sans">
            Shift + Enter
          </kbd>{' '}
          for new line
        </div>
      </div>
    </div>
  );
};
