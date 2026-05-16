import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-slate-950 font-inter text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* ── Public Header ── */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-lg border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-glow group-hover:scale-105 transition-transform duration-300">
                  P
                </div>
                <span className="font-bold text-xl tracking-tight text-white">
                  Project
                  <span className="text-primary-500">Flow</span>
                </span>
              </Link>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-4">
              {location.pathname !== '/login' && (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-primary-400 transition-colors px-3 py-2"
                >
                  <LogIn size={18} />
                  Sign in
                </Link>
              )}

              <ThemeToggle />

              {location.pathname !== '/register' && (
                <Link
                  to="/register"
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  <UserPlus size={18} />
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>

      {/* ── Public Footer ── */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-center text-sm text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-bold text-white">ProjectFlow</span> ©{' '}
            {new Date().getFullYear()}
          </div>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-primary-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-primary-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="#" className="hover:text-primary-400 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
