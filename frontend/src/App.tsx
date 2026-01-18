import { AuthProvider } from './context/AuthProvider';
import { WorkspaceProvider } from './context/WorkspaceProvider';
import { AppRoutes } from './AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <AppRoutes />
      </WorkspaceProvider>
    </AuthProvider>
  );
}
