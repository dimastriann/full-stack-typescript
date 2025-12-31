import { TaskProvider } from '../hooks/useTasks';
import TaskForm from '../components/TaskForm';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_TASK } from '../gql/task.graphql';
import { CommentThread } from '../../../components/comments/CommentThread';
import { FileUpload } from '../../../components/upload/FileUpload';

export default function TaskFormPage() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const id = taskId ? parseInt(taskId, 10) : 0;

  const { data, loading, error, refetch } = useQuery(GET_TASK, {
    variables: { id },
    skip: !id,
  });

  const handleSuccess = () => {
    navigate('/dashboard/tasks');
  };

  const handleCancel = () => {
    navigate('/dashboard/tasks');
  };

  const task = data?.getTask;

  return (
    <TaskProvider>
      <div className="mx-auto py-6 max-w-5xl">
        <div className="mb-6 flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <TaskForm onSuccess={handleSuccess} onCancel={handleCancel} />
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <CommentThread
                comments={task?.comments || []}
                taskId={id}
                refetch={refetch}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <FileUpload
                relationId={id}
                relationType="task"
                onUploadSuccess={refetch}
              />

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files</h4>
                {task?.attachments && task.attachments.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {task.attachments.map((file: any) => (
                      <li key={file.id} className="py-2 flex justify-between items-center">
                        <a href={file.path} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate text-sm">
                          {file.filename}
                        </a>
                        <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
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
    </TaskProvider>
  );
}
