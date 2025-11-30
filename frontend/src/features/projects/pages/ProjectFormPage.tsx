import { useNavigate } from 'react-router-dom';
import ProjectForm from '../components/ProjectForm';
import { ArrowLeft } from 'lucide-react';

export default function ProjectFormPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard/projects');
  };

  const handleCancel = () => {
    navigate('/dashboard/projects');
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6 flex items-center">
        <button
          onClick={handleCancel}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <ProjectForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}
