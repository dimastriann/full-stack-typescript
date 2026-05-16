import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Logger from '../../../lib/logger';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../gql/user.graphql';
import { useUserContext } from '../hooks/useUsers';

const defaultValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
  mobile: '',
  firstName: '',
  lastName: '',
  status: true,
  address: '',
  bio: '',
  birthDate: '',
  role: 'USER',
};

interface UserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  userId?: string | number; // Optional prop to override params
  isFromProfile?: boolean;
}

export default function UserForm({
  onSuccess,
  onCancel,
  userId: propUserId,
  isFromProfile,
}: UserFormProps) {
  const { userId: paramUserId } = useParams();
  // Use propUserId if provided (converted to string for consistency), else paramUserId
  const userId = propUserId ? String(propUserId) : paramUserId;
  const isEditMode = !!userId;

  // Only fetch if we are in edit mode (have a userId)
  const { data, loading: queryLoading } = useQuery(GET_USER, {
    skip: !isEditMode,
    variables: { id: parseInt(userId || '0') },
  });

  const {
    createRecord,
    updateRecord,
    refetch,
    loading: mutationLoading,
  } = useUserContext();
  const [errorMsg, setErrorMsg] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues,
  });

  // Update form values when data is fetched in edit mode
  useEffect(() => {
    if (data?.getUser) {
      const user = data.getUser;
      reset({
        ...defaultValues,
        ...user,
        birthDate: user.birthDate
          ? new Date(user.birthDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [data, reset]);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const userFormData = { ...formData } as any;
      if (isEditMode) {
        // Remove password if empty to avoid overwriting with empty string
        if (!userFormData.password) delete userFormData.password;
        if ('__typename' in userFormData) delete userFormData.__typename;

        // Ensure id is present in the input
        userFormData.id = parseInt(userId!);

        await updateRecord({
          variables: {
            input: userFormData,
          },
        });
      } else {
        if (!userFormData.birthDate) {
          delete userFormData.birthDate;
        }
        await createRecord({ variables: { input: userFormData } });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        await refetch();
      }
    } catch (err) {
      Logger.error(err as string);
      setErrorMsg(`${err}`);
    }
  });

  if (queryLoading)
    return (
      <p className="p-6 text-gray-500 dark:text-gray-400">
        Loading user data...
      </p>
    );
  if (!data?.getUser && userId)
    return <p className="p-6 text-red-500 dark:text-red-400">User not found</p>;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-modern">First Name</label>
            <input
              {...register('name', { required: 'First name is required' })}
              placeholder="First Name"
              className="input-modern"
            />
            {errors.name && (
              <span className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 block px-1 animate-slide-in-up">
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label className="label-modern">Last Name</label>
            <input
              {...register('lastName')}
              placeholder="Last Name"
              className="input-modern"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label-modern">Email</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              placeholder="Email"
              className="input-modern"
            />
            {errors.email && (
              <span className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 block px-1 animate-slide-in-up">
                {errors.email.message}
              </span>
            )}
          </div>

          {!isEditMode && (
            <div className="md:col-span-2">
              <label className="label-modern">Password</label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
                type="password"
                placeholder="Password"
                className="input-modern"
              />
              {errors.password && (
                <span className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 block px-1 animate-slide-in-up">
                  {errors.password.message}
                </span>
              )}
            </div>
          )}

          <div>
            <label className="label-modern">Mobile</label>
            <input
              {...register('mobile')}
              placeholder="Mobile Phone"
              className="input-modern"
            />
          </div>

          <div>
            <label className="label-modern">Birth Date</label>
            <input
              {...register('birthDate')}
              type="date"
              className="input-modern"
            />
          </div>

          {!isFromProfile && (
            <div className="md:col-span-2">
              <label className="label-modern">Role</label>
              <select {...register('role')} className="select-modern">
                <option value="USER" className="dark:bg-slate-900">
                  User
                </option>
                <option value="MANAGER" className="dark:bg-slate-900">
                  Manager
                </option>
                <option value="ADMIN" className="dark:bg-slate-900">
                  Admin
                </option>
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="label-modern">Address</label>
            <textarea
              {...register('address')}
              placeholder="Address"
              rows={2}
              className="input-modern"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label-modern">Bio</label>
            <textarea
              {...register('bio')}
              placeholder="Bio"
              rows={3}
              className="input-modern"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl my-4 p-4 text-red-700 dark:text-red-400 relative animate-slide-in-up transition-colors">
            <div className="flex items-center gap-3">
              <span className="flex-1 text-sm font-bold">{errorMsg}</span>
              <X
                className="cursor-pointer text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors size-5"
                onClick={() => setErrorMsg('')}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 dark:border-slate-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border border-surface-200 dark:border-slate-800 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-surface-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={mutationLoading}
            className="inline-flex justify-center px-8 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
          >
            {mutationLoading
              ? 'Saving...'
              : isEditMode
                ? 'Update Profile'
                : 'Create Account'}
          </button>
        </div>
      </form>
    </>
  );
}
