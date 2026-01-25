import { useNavigate, useParams } from 'react-router-dom';
import Logger from '../../../lib/logger';
import ProjectForm from '../components/ProjectForm';
import { ArrowLeft } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';

import { GET_PROJECT } from '../gql/project.graphql';
import { CommentThread } from '../../../components/comments/CommentThread';
import { FileUpload } from '../../../components/upload/FileUpload';
import { useAuth } from '../../../context/AuthProvider';
import ProjectMembersList from '../components/ProjectMembersList';

import { REMOVE_ATTACHMENT } from '../../attachments/gql/attachment.graphql';
import { Trash2, Download } from 'lucide-react';
import { useAttachments } from '../../attachments/hooks/useAttachments';

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id || 0;
  const { projectId } = useParams();
  const id = projectId ? parseInt(projectId, 10) : 0;

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
    <div className="mx-auto py-6">
      <div className="mb-6 flex items-center">
        <button
          onClick={handleCancel}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Project Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            {/* Pass project data or let form handle it via context if it prefers, but usually form needs initial values */}
            <ProjectForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <CommentThread
              comments={project?.comments || []}
              projectId={id}
              refetch={refetch}
            />
          </div>
        </div>

        <div className="space-y-6">
          {id > 0 && (
            <ProjectMembersList projectId={id} currentUserId={currentUserId} />
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <FileUpload
              relationId={id}
              relationType="project"
              onUploadSuccess={refetch}
            />

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Attached Files
              </h4>
              {project?.attachments && project.attachments.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {project.attachments.map((file: any) => (
                    <li
                      key={file.id}
                      className="py-2 flex justify-between items-center group"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <button
                          onClick={() => handlePreviewFile(file)}
                          className="text-indigo-600 hover:underline truncate text-sm text-left"
                        >
                          {file.filename}
                        </button>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="text-gray-400 hover:text-indigo-600 p-1"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(file.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Delete attachment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No attachments.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
