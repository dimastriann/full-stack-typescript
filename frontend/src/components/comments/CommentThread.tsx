import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import Logger from '../../lib/logger';
import { CREATE_COMMENT } from '../../features/comments/gql/comment.graphql';

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

const CommentItem = ({
  comment,
  projectId,
  taskId,
  refetch,
  depth = 0,
}: {
  comment: Comment;
  projectId?: number;
  taskId?: number;
  refetch: () => void;
  depth?: number;
}) => {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [createComment] = useMutation(CREATE_COMMENT);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await createComment({
        variables: {
          createCommentInput: {
            content: replyContent,
            userId: JSON.parse(sessionStorage.getItem('user') || '{}').id,
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
    <div
      style={{
        marginLeft: depth * 20,
        marginBottom: 10,
        borderLeft: '1px solid #ddd',
        paddingLeft: 10,
      }}
    >
      <div>
        <strong>{comment.user.name}</strong>{' '}
        <small>{new Date(comment.createdAt).toLocaleString()}</small>
        <p>{comment.content}</p>
        <button
          onClick={() => setShowReply(!showReply)}
          style={{
            fontSize: '0.8em',
            background: 'none',
            border: 'none',
            color: 'blue',
            cursor: 'pointer',
          }}
        >
          {showReply ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {showReply && (
        <div style={{ marginTop: 5 }}>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            style={{ width: '100%', height: 60 }}
          />
          <button onClick={handleReply} style={{ marginTop: 5 }}>
            Post Reply
          </button>
        </div>
      )}

      {comment.replies &&
        comment.replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            projectId={projectId}
            taskId={taskId}
            refetch={refetch}
            depth={depth + 1}
          />
        ))}
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
  const [createComment] = useMutation(CREATE_COMMENT);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment({
        variables: {
          createCommentInput: {
            content: newComment,
            userId: JSON.parse(sessionStorage.getItem('user') || '{}').id,
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
    <div className="comment-thread">
      <h3>Comments</h3>
      <div style={{ marginBottom: 20 }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          style={{ width: '100%', height: 80 }}
        />
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-md"
          onClick={handlePostComment}
          style={{ marginTop: 5 }}
        >
          Post Comment
        </button>
      </div>

      <div>
        {comments &&
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              projectId={projectId}
              taskId={taskId}
              refetch={refetch}
            />
          ))}
      </div>
    </div>
  );
};
