import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../gql/user.graphql';
import { useUserContext } from '../hooks/useUsers';

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
      const userFormData: any = { ...formData };
      if (isEditMode) {
        // Remove password if empty to avoid overwriting with empty string
        // Remove password if empty to avoid overwriting with empty string
        // const updateData: any = { ...formData };
        if (!userFormData.password) delete userFormData.password;
        if ('__typename' in userFormData) delete userFormData.__typename;

        // Ensure id is present in the input
        userFormData.id = parseInt(userId!);

        console.info('update user', userFormData);

        await updateRecord({
          variables: {
            input: userFormData,
          },
        });
      } else {
        console.info('create user', userFormData);
        if (!userFormData.birthDate) {
          delete userFormData.birthDate;
        }
        await createRecord({ variables: { input: userFormData } });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // If no onSuccess prop (e.g. page mode), maybe redirect or show success
        // For now, just refetch
        await refetch();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(`${err}`);
    }
  });

  if (queryLoading) return <p className="p-4">Loading user data...</p>;
  if (!data?.getUser && userId) return <p className="p-4">User not found</p>;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              {...register('name', { required: 'First name is required' })}
              placeholder="First Name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
            {errors.name && (
              <span className="text-red-500 text-xs">
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              {...register('lastName')}
              placeholder="Last Name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
            {errors.email && (
              <span className="text-red-500 text-xs">
                {errors.email.message}
              </span>
            )}
          </div>

          {!isEditMode && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
                type="password"
                placeholder="Password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
              />
              {errors.password && (
                <span className="text-red-500 text-xs">
                  {errors.password.message}
                </span>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile
            </label>
            <input
              {...register('mobile')}
              placeholder="Mobile Phone"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Birth Date
            </label>
            <input
              {...register('birthDate')}
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>

          {!isFromProfile && <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              {...register('role')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            >
              <option value="USER">User</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              {...register('address')}
              placeholder="Address"
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              {...register('bio')}
              placeholder="Bio"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="border-red-600 border-[1px] rounded-md my-2 p-2 text-red-600 bg-red-100 relative">
            {errorMsg}
            <X
              className="cursor-pointer text-black absolute top-1 right-1 size-5"
              onClick={() => setErrorMsg('')}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={mutationLoading}
            className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {mutationLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </>
  );
}
