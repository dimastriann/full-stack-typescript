import UserList from '../components/UserList';
import { UserProvider } from '../hooks/useUsers';

export default function UserPage() {
  return (
    <>
      <UserProvider>
        <UserList />
      </UserProvider>
    </>
  );
}
