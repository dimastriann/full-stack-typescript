import { useState } from 'react';
import TaskForm from '../components/TaskForm';
import { useNavigate, useParams } from 'react-router-dom';
import Logger from '../../../lib/logger';
import { useQuery, useMutation } from '@apollo/client';

import { GET_TASK } from '../gql/task.graphql';
import { CommentThread } from '../../../components/comments/CommentThread';
import { FileUpload } from '../../../components/upload/FileUpload';
import { REMOVE_ATTACHMENT } from '../../attachments/gql/attachment.graphql';
import {
  Trash2,
  Download,
  FileText,
  Timer,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import { useAttachments } from '../../attachments/hooks/useAttachments';
import TaskTimesheetTable from '../components/TaskTimesheetTable';

export default function TaskFormPage() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const id = taskId ? parseInt(taskId, 10) : 0;

  const [activeTab, setActiveTab] = useState<
    'details' | 'timesheets' | 'attachments'
  >('details');

  const { data, refetch } = useQuery(GET_TASK, {
    variables: { id },
    skip: !id,
  });
  const [removeAttachment] = useMutation(REMOVE_ATTACHMENT);
  const { handlePreviewFile, handleDownloadFile } = useAttachments();

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this attachment?'))
      return;
    try {
      await removeAttachment({
        variables: { id: attachmentId },
      });
      refetch();
    } catch (error) {
      Logger.error('Error deleting attachment:', error as any);
      alert('Failed to delete attachment');
    }
  };

  const handleSuccess = () => {
    navigate('/dashboard/tasks');
  };

  const handleCancel = () => {
    navigate('/dashboard/tasks');
  };

  const task = data?.getTask;

  return (
    <div className="mx-auto py-6 h-full flex flex-col page-enter">
      {/* ── Header Card ── */}
      {id > 0 && task && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                TASK-{id}
              </span>
              <span className="badge bg-surface-100 text-gray-600">
                {task.type}
              </span>
              <span className="badge bg-surface-100 text-gray-600">
                {task.priority} Priority
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {task.user && (
              <div className="flex flex-col items-end">
                <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-1">
                  Assignee
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {task.user.firstName?.[0] || 'U'}
                  </div>
                  <span className="font-medium text-gray-900">
                    {task.user.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!id && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details below to start a new task.
          </p>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column: Tabs & Content */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          {/* Tabs */}
          {id > 0 && (
            <div className="flex items-center gap-2 mb-4 border-b border-surface-200 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setActiveTab('details')}
                className={`tab-item flex items-center gap-2 ${activeTab === 'details' ? 'tab-item-active' : ''}`}
              >
                <FileText size={16} /> Details
              </button>
              <button
                onClick={() => setActiveTab('timesheets')}
                className={`tab-item flex items-center gap-2 ${activeTab === 'timesheets' ? 'tab-item-active' : ''}`}
              >
                <Timer size={16} /> Timesheets
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`tab-item flex items-center gap-2 ${activeTab === 'attachments' ? 'tab-item-active' : ''}`}
              >
                <Paperclip size={16} /> Attachments
                {task?.attachments?.length > 0 && (
                  <span className="ml-1 bg-surface-200 text-gray-600 text-xs px-1.5 rounded-full">
                    {task.attachments.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {activeTab === 'details' && (
              <div className="pb-6">
                <TaskForm onSuccess={handleSuccess} onCancel={handleCancel} />
              </div>
            )}

            {activeTab === 'timesheets' && id > 0 && task && (
              <div className="pb-6">
                <TaskTimesheetTable
                  taskId={task.id}
                  userId={task.userId}
                  projectId={task.projectId}
                />
              </div>
            )}

            {activeTab === 'attachments' && id > 0 && (
              <div className="space-y-6 pb-6">
                <div className="card p-6">
                  <div className="form-section-title">
                    <Paperclip size={16} className="text-primary-500" />
                    Upload Files
                  </div>
                  <FileUpload
                    relationId={id}
                    relationType="task"
                    onUploadSuccess={refetch}
                  />
                </div>

                <div className="card p-6">
                  <div className="form-section-title mb-2">
                    <FileText size={16} className="text-primary-500" />
                    Attached Files
                  </div>
                  {task?.attachments && task.attachments.length > 0 ? (
                    <ul className="divide-y divide-surface-100">
                      {task.attachments.map((file: any) => (
                        <li
                          key={file.id}
                          className="py-3 flex justify-between items-center group"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="p-2 bg-surface-50 rounded-lg">
                              <FileText size={16} className="text-gray-400" />
                            </div>
                            <div className="flex flex-col truncate">
                              <button
                                onClick={() => handlePreviewFile(file)}
                                className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate text-left transition-colors"
                              >
                                {file.filename}
                              </button>
                              <span className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttachment(file.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete attachment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No attachments yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Comments */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <div className="card flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-surface-200 bg-surface-50/50 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-500" />
              <h3 className="font-semibold text-gray-700 text-sm">Comments</h3>
              {task?.comments?.length > 0 && (
                <span className="ml-auto bg-white border border-surface-200 text-gray-600 text-xs px-2 py-0.5 rounded-full shadow-sm font-medium">
                  {task.comments.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {id > 0 ? (
                <CommentThread
                  comments={task?.comments || []}
                  taskId={id}
                  refetch={refetch}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-400 text-sm p-4">
                  Save the task first to enable comments.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
