import UserForm from '../components/UserForm';
import { useAuth } from '../../../context/AuthProvider';

export default function ProfilePage() {
  const { user } = useAuth();

  const handleSuccess = () => {
    // Optionally show a success message or just stay on the page
    alert('Profile updated successfully');
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6 flex items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {user ? (
          <UserForm userId={user.id} onSuccess={handleSuccess} isFromProfile />
        ) : (
          <p>Loading profile...</p>
        )}
      </div>
    </div>
  );
}
