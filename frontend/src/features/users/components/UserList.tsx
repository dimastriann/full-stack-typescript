import React from 'react';
import useUsers, { useUserStore } from '../hooks/useUsers';
import type { UserType } from '../../../types/Users';
import { useNavigate } from 'react-router-dom';

// Separate component for individual user rows to prevent unnecessary re-renders
const UserRow = React.memo(
  ({
    user,
    onEdit,
    onDelete,
    onChangeCheckbox,
  }: {
    user: UserType;
    onEdit: (user: UserType) => void;
    onDelete: (user: UserType) => void;
    onChangeCheckbox: (e: React.ChangeEvent) => void;
  }) => (
    <tr className="hover:bg-gray-200 cursor-pointer">
      <td className="text-center w-[5%]">
        <input
          onChange={onChangeCheckbox}
          name={user.id?.toString() || ''}
          checked={false}
          type="checkbox"
        />
      </td>
      <td className="px-4 py-2 border">{user.id}</td>
      <td className="px-4 py-2 border">{user.name}</td>
      <td className="px-4 py-2 border">{user.email}</td>
      <td className="px-4 py-2 border">
        {new Date(user.birthDate || '').toDateString()}
      </td>
      <td className="px-4 py-2 border">{user.mobile}</td>
      <td className="px-4 py-2 border">{user.role}</td>
      <td className="px-4 py-2 border text-center">
        {/* <span className={`p-1 text-white rounded-lg ${user.status ? 'bg-green-600' : 'bg-red-600'}`}>
                {user.status ? "Active" : "Inactive"}
            </span> */}
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            user.status
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {user.status ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-2 border space-x-2">
        <button
          className="text-blue-600 hover:underline"
          onClick={() => onEdit(user)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline"
          onClick={() => onDelete(user)}
        >
          Delete
        </button>
      </td>
    </tr>
  ),
);

UserRow.displayName = 'UserRow';

export default function UserList() {
  const { deleteUser, refetch, loading, users, error } = useUsers();
  const setEditingUser = useUserStore((state) => state.setEditingUser);
  const navigate = useNavigate();

  // Combine multiple selectors into one to reduce subscriptions
  // const { users, error, loading, setEditingUser } = useUserStore((state) => ({
  //     users: state.users,
  //     error: state.error,
  //     loading: state.loading,
  //     setEditingUser: state.setEditingUser
  // }));

  // Memoize event handlers to prevent recreation on every render
  const changeCheckbox = React.useCallback((e: React.ChangeEvent) => {
    console.log('click checkbox', e);
  }, []);

  const handleEditUser = React.useCallback(
    (user: UserType) => {
      setEditingUser(true, user);
      navigate(`/dashboard/user/${user.id}`);
    },
    [setEditingUser],
  );

  const handleDeleteUser = React.useCallback(
    async (user: UserType) => {
      if (confirm(`Delete user "${user.name}"?`)) {
        await deleteUser({ variables: { id: user.id } });
        await refetch();
      }
    },
    [deleteUser, refetch],
  );

  // Memoize the table rows to prevent unnecessary re-renders
  const tableRows = React.useMemo(
    () =>
      users.map((user: UserType) => (
        <UserRow
          key={user.id}
          user={user}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onChangeCheckbox={changeCheckbox}
        />
      )),
    [users, changeCheckbox, handleEditUser, handleDeleteUser],
  );

  if (loading) return <p>Loading...</p>;

  return (
    <div className="">
      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error fetching users</p>
      ) : (
        <table className="min-w-full table-auto text-sm border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="text-center px-4 py-2 border w-[5%]">
                <input
                  onChange={changeCheckbox}
                  name="all_checked"
                  type="checkbox"
                />
              </th>
              <th className="text-left px-4 py-2 border">ID</th>
              <th className="text-left px-4 py-2 border">Name</th>
              <th className="text-left px-4 py-2 border">Email</th>
              <th className="text-left px-4 py-2 border">Birth Date</th>
              <th className="text-left px-4 py-2 border">Mobile</th>
              <th className="text-left px-4 py-2 border">Role</th>
              <th className="text-left px-4 py-2 border">Status</th>
              <th className="text-center px-4 py-2 border w-[15%]">Actions</th>
            </tr>
          </thead>
          <tbody>{tableRows}</tbody>
        </table>
      )}
    </div>
  );
}
