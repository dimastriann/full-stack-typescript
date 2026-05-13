import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION } from '../gql/auth.graphql';
import { Link, useNavigate } from 'react-router-dom';
import Logger from '../../../lib/logger';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const login = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const [registerMutation, { loading }] = useMutation(REGISTER_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { data } = await registerMutation({
        variables: {
          createUserInput: {
            ...formData,
            status: true,
          },
        },
      });
      if (data?.register) {
        login(data.register.user, 'logged_in');
        navigate('/dashboard');
      }
    } catch (err: any) {
      Logger.error(err as string);
      setErrorMsg('Registration failed. Please check your details and try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 page-enter relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-primary-200/50 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob"></div>
      <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-emerald-200/50 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full relative z-10">
        
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white mb-6 shadow-glow">
            <UserPlus size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create an account</h2>
          <p className="mt-2 text-sm text-gray-500">
            Join ProjectFlow and start managing your team
          </p>
        </div>

        <div className="card p-8 shadow-float">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-in-up">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-red-700 font-medium">{errorMsg}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label-modern">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="input-modern"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="label-modern">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="input-modern"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="label-modern">Username</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input-modern pl-10"
                  placeholder="johndoe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label-modern">Email address</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-modern pl-10"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label-modern">Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-modern pl-10"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all hover:shadow-md"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link
              to="/login"
              className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
