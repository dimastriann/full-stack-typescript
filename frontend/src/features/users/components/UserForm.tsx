import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
// import useUsers, { useUserStore } from '../hooks/useUsers';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import type { viewType } from '../../../types/View';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../gql/user.graphql';
import { useUserContext } from '../hooks/useUsers';
import ErrorSection from '../../../components/ErrorSection';

export default function UserForm({
  setActiveView,
}: {
  setActiveView?: (v: viewType) => void;
}) {
  const defaultValues = {
    name: '',
    email: '',
    avatar: '',
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

  const { userId } = useParams();
  console.info("userId", userId)
  const isEditMode = !!userId;
  const { data } = useQuery(GET_USER, {
      skip: !isEditMode, // Skip query if no userId
      variables: { id: parseInt(userId) },
  });
  // console.info("result", data)
  const {records, editingRecord, createRecord, refetch, loading, error} = useUserContext();
  const [errorMsg, setErrorMsg] = useState<string>('');

  console.log('editing', editingRecord, records);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { ...(editingRecord || defaultValues) },
  });

  const onSubmit = handleSubmit((data) => {
    console.log('submit form', data);
    // createRecord({ variables: { input: data } }).then(() => refetch());
  });

  // const handleSubmit = useCallback(async (e: React.FormEvent) => {
  //     e.preventDefault();
  //     console.log('user submit', userInput)
  //     try {
  //         if (!userInput?.name.trim() || !userInput?.email.trim()) {
  //             setErrorMsg("Please input name and email correctly!")
  //             return null;
  //         };
  //         if (editingUser) {
  //             await updateUser({ variables: {id: userInput.id, ...userInput} });
  //             setEditingUser(false);
  //         } else {
  //             await createUser({ variables: { ...userInput } });
  //         }
  //         refetch();
  //         resetUserInput();
  //         setErrorMsg("")
  //     } catch (error) {
  //         // console.info("res create", error)
  //         setErrorMsg(`${error}`)
  //     }
  // }, [userInput])

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     // props.setUser({
  //     //     ...props.userInput,
  //     //     [e.target.name]: e.target.value
  //     // })
  //     setUserInput({
  //         ...userInput,
  //         [e.target.name]: e.target.value
  //     })
  // }

  if (loading) return null;
  if (error) return <><ErrorSection errorMessage={errorMsg} close={setErrorMsg} /></>;

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="space-y-4 p-4 border rounded-lg bg-white shadow-md"
      >
        <input
          {...register('name', { required: true })}
          placeholder="First Name"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        {errors.name && <span>This field is required</span>}
        <input
          {...register('lastName')}
          placeholder="Last Name"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        {errors.lastName && <span>This field is required</span>}
        <input
          {...register('email', { required: true })}
          type="email"
          placeholder="email"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        <input
          {...register('password', { required: true, minLength: 6 })}
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        {errors.password && <span>This field is required</span>}
        <input
          {...register('birthDate', { required: false })}
          type="date"
          placeholder="Birth Date"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        <input
          {...register('mobile', { required: false })}
          placeholder="Mobile Phone"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        <input
          {...register('phone', { required: false })}
          placeholder="Phone Number"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        {/* <input {...register("gender", {required: false})}
                type="date"
                placeholder="Birth Date"
                className="w-full border border-gray-300 px-3 py-2 rounded"
            /> */}
        <textarea
          {...register('address', { required: false })}
          placeholder="Address"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        <textarea
          {...register('bio', { required: false })}
          placeholder="Bio"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingRecord ? 'Save' : 'Add'}
        </button>
        {editingRecord && (
          <button
            type="button"
            onClick={() => console.info("cancel")}
            className="hover:underline bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </form>
      {errorMsg ? (
        <div className="border-red-600 border-[1px] rounded-md my-2 p-2 text-red-600 bg-red-100 relative">
          {errorMsg}
          <X
            className="cursor-pointer text-black absolute top-1 right-1 size-5"
            onClick={() => setErrorMsg('')}
          />
        </div>
      ) : (
        <div />
      )}
    </>
  );
}
