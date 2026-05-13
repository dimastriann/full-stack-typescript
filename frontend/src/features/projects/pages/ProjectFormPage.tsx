import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Logger from '../../../lib/logger';
import ProjectForm from '../components/ProjectForm';
import { useQuery, useMutation } from '@apollo/client';

import { GET_PROJECT } from '../gql/project.graphql';
import { CommentThread } from '../../../components/comments/CommentThread';
import { FileUpload } from '../../../components/upload/FileUpload';
import { useAuthStore } from '../../../store/authStore';
import ProjectMembersList from '../components/ProjectMembersList';
import ProjectTaskTable from '../components/ProjectTaskTable';

import { REMOVE_ATTACHMENT } from '../../attachments/gql/attachment.graphql';
import {
  Trash2,
  Download,
  FileText,
  ListCheck,
  Users,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import { useAttachments } from '../../attachments/hooks/useAttachments';

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id || 0;
  const { projectId } = useParams();
  const id = projectId ? parseInt(projectId, 10) : 0;

  const [activeTab, setActiveTab] = useState<
    'details' | 'tasks' | 'members' | 'attachments'
  >('details');

  const { data, refetch } = useQuery(GET_PROJECT, {
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
    navigate('/dashboard/projects');
  };

  const handleCancel = () => {
    navigate('/dashboard/projects');
  };

  const project = data?.project;

  return (
    <div className="mx-auto py-6 h-full flex flex-col page-enter">
      {/* ── Header Card ── */}
      {id > 0 && project && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                #{id}
              </span>
              <span className="badge bg-surface-100 text-gray-600">
                {project.methodology}
              </span>
              <span className="badge bg-surface-100 text-gray-600">
                {project.stage?.title || 'No Stage'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase font-semibold tracking-wider mb-1">
                Progress
              </span>
              <div className="w-32 h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${project.progress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!id && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Project
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details below to start a new project.
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
                onClick={() => setActiveTab('tasks')}
                className={`tab-item flex items-center gap-2 ${activeTab === 'tasks' ? 'tab-item-active' : ''}`}
              >
                <ListCheck size={16} /> Tasks
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`tab-item flex items-center gap-2 ${activeTab === 'members' ? 'tab-item-active' : ''}`}
              >
                <Users size={16} /> Members
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`tab-item flex items-center gap-2 ${activeTab === 'attachments' ? 'tab-item-active' : ''}`}
              >
                <Paperclip size={16} /> Attachments
                {project?.attachments?.length > 0 && (
                  <span className="ml-1 bg-surface-200 text-gray-600 text-xs px-1.5 rounded-full">
                    {project.attachments.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {activeTab === 'details' && (
              <div className="pb-6">
                <ProjectForm
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </div>
            )}

            {activeTab === 'tasks' && id > 0 && (
              <div className="pb-6">
                <ProjectTaskTable projectId={id} />
              </div>
            )}

            {activeTab === 'members' && id > 0 && (
              <div className="pb-6">
                <ProjectMembersList
                  projectId={id}
                  currentUserId={currentUserId}
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
                    relationType="project"
                    onUploadSuccess={refetch}
                  />
                </div>

                <div className="card p-6">
                  <div className="form-section-title mb-2">
                    <FileText size={16} className="text-primary-500" />
                    Attached Files
                  </div>
                  {project?.attachments && project.attachments.length > 0 ? (
                    <ul className="divide-y divide-surface-100">
                      {project.attachments.map((file: any) => (
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
              {project?.comments?.length > 0 && (
                <span className="ml-auto bg-white border border-surface-200 text-gray-600 text-xs px-2 py-0.5 rounded-full shadow-sm font-medium">
                  {project.comments.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {id > 0 ? (
                <CommentThread
                  comments={project?.comments || []}
                  projectId={id}
                  refetch={refetch}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-400 text-sm p-4">
                  Save the project first to enable comments.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
