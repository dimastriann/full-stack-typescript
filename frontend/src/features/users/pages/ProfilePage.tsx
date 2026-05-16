import UserForm from '../components/UserForm';
import { useAuthStore } from '../../../store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  const handleSuccess = () => {
    // Optionally show a success message or just stay on the page
    alert('Profile updated successfully');
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6 flex items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl p-8 border border-surface-200 dark:border-slate-800">
        {user ? (
          <UserForm userId={user.id} onSuccess={handleSuccess} isFromProfile />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        )}
      </div>
    </div>
  );
}
