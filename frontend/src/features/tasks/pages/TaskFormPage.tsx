import { TaskProvider } from '../hooks/useTasks';
import TaskForm from '../components/TaskForm';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TaskFormPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard/tasks');
  };

  const handleCancel = () => {
    navigate('/dashboard/tasks');
  };
  return (
    <TaskProvider>
      <div className="mx-auto py-6">
        <div className="mb-6 flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <TaskForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </div>
    </TaskProvider>
  );
}
