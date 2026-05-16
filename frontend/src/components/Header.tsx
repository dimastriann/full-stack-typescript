import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Header(): React.ReactElement {
  const session = useAuthStore((state) => state.session);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-black text-white tracking-tight hover:scale-105 transition-transform"
        >
          Project<span className="text-primary-600">Flow</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="text-sm font-bold text-gray-300 hover:text-primary-400 transition-colors"
          >
            Dashboard
          </Link>
          {!session && (
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-glow hover:shadow-lg transition-all active:scale-95"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
