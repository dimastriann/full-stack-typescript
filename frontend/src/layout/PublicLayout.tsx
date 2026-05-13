import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 font-inter text-gray-900">
      {/* ── Public Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-glow group-hover:scale-105 transition-transform duration-300">
                  P
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">
                  Project<span className="text-primary-600">Flow</span>
                </span>
              </Link>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-4">
              {location.pathname !== '/login' && (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors px-3 py-2"
                >
                  <LogIn size={18} />
                  Sign in
                </Link>
              )}
              
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
      <footer className="bg-white border-t border-surface-200 py-8 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-bold text-gray-900">ProjectFlow</span> © {new Date().getFullYear()}
          </div>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-primary-600 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary-600 transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-primary-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
