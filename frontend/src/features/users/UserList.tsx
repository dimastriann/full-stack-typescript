import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { GET_USERS, CREATE_USER, UPDATE_USER, DELETE_USER } from "./user.graphql";
import type { User } from "../../types/Users";


type UserListProps = {
    editUser: Function
}


export default function UserList(props: UserListProps) {
    const { data, loading, error, refetch } = useQuery(GET_USERS);
    // const [createUser] = useMutation(CREATE_USER);
    // const [updateUser] = useMutation(UPDATE_USER);
    const [deleteUser] = useMutation(DELETE_USER);
    // const [name, setName] = useState("");
    // const [email, setEmail] = useState("");
    // const [editingUser, setEditingUser] = useState<User | null>(null);

    // const resetPayload = () => {
    //     setEmail("");
    //     setName("");
    // }

    // const handleSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     console.log('user', name, email)
    //     if (!name.trim() || !email.trim()) {
    //         throw new Error("Please input name and email correctly!")
    //     };
    //     if (editingUser) {
    //         await updateUser({ variables: { id: editingUser.id, name, email } });
    //         setEditingUser(null);
    //     } else {
    //         await createUser({ variables: { name, email } });
    //     }
    //     resetPayload();
    //     refetch();
    // };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-6 max-w-xl mx-auto font-sans">
            <h1 className="text-3xl font-bold underline mb-2 text-black">User Management</h1>

            {/* Form */}
            {/* <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 border border-gray-300 px-3 py-2 rounded"
                />
                <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 border border-gray-300 px-3 py-2 rounded"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {editingUser ? 'Save' : 'Add'}
                </button>
                {editingUser && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingUser(null);
                            resetPayload();
                        }}
                        className="text-gray-200 hover:underline"
                    >
                        Cancel
                    </button>
                )}
            </form> */}

            {/* Table */}
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p>Error fetching users</p>
            ) : (
                <table className="w-full border-collapse text-black">
                    <thead>
                        <tr className="bg-gray-500">
                            <th className="text-left px-4 py-2 border">ID</th>
                            <th className="text-left px-4 py-2 border">Name</th>
                            <th className="text-center px-4 py-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.users.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-500">
                                <td className="px-4 py-2 border">{user.id}</td>
                                <td className="px-4 py-2 border">{user.name}</td>
                                <td className="px-4 py-2 border space-x-2">
                                    <button
                                        className="text-blue-600 hover:underline"
                                        onClick={
                                            () => {
                                                props.editUser(user);
                                                // setName(user.name);
                                                // setEmail(user.email);
                                            }
                                        }
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="text-red-600 hover:underline"
                                        onClick={async () => {
                                            if (confirm(`Delete user "${user.name}"?`)) {
                                                await deleteUser({ variables: { id: user.id } });
                                                refetch();
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}