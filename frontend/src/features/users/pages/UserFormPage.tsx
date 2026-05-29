import { useNavigate } from 'react-router-dom';
import UserForm from '../components/UserForm';
import { ArrowLeft } from 'lucide-react';

export default function UserFormPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard/users');
  };

  const handleCancel = () => {
    navigate('/dashboard/users');
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6 flex items-center">
        <button
          onClick={handleCancel}
          className="mr-4 p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit User
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl p-8 border border-surface-200 dark:border-slate-800 transition-colors">
        <UserForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}
