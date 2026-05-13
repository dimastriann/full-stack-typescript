import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logger from '../../../lib/logger';
import { useAuthStore } from '../../../store/authStore';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '../gql/auth.graphql';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const login = useAuthStore((state) => state.setAuth);
  const session = useAuthStore((state) => state.session);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });
      if (data?.login) {
        login(data.login.user, 'logged_in');
        navigate('/dashboard');
      }
    } catch (err) {
      Logger.error(err as string);
      setErrorMsg('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 page-enter relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-200/50 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-md w-full relative z-10">
        
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white mb-6 shadow-glow">
            <LogIn size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your account to continue
          </p>
        </div>

        <div className="card p-8 shadow-float">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-in-up">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-red-700 font-medium">{errorMsg}</div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="label-modern">
                  Email address
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-modern pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                   <label htmlFor="password" className="label-modern !mb-0">
                     Password
                   </label>
                   <Link to="#" className="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                     Forgot password?
                   </Link>
                </div>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="input-modern pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all hover:shadow-md"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <Link
              to="/register"
              className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
