import { useQuery } from "@apollo/client";
import { GET_USERS } from "./user.graphql";


type UserListProps = {
    editUser: Function
    deleteUser: Function
}


export default function UserList(props: UserListProps) {
    const { data, loading, error } = useQuery(GET_USERS);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-6 max-w-xl mx-auto font-sans">
            <h1 className="text-3xl font-bold underline mb-2 text-black">User Management</h1>

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
                                            }
                                        }
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="text-red-600 hover:underline"
                                        onClick={async () => {
                                            if (confirm(`Delete user "${user.name}"?`)) {
                                                await props.deleteUser(user);
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