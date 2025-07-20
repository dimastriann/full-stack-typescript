import type { User } from "../../types/Users";


type UserFormProps = {
    userInput: User | null
    setUser: Function
    submit: (e: React.FormEvent) => void
    editUser: User | null
    setEditUser: Function
    cancelEdit: () => void
}


export default function UserForm(props: UserFormProps) {

    const handleChange = (e: any) => {
        props.setUser({
            ...props.userInput,
            [e.target.name]: e.target.value
        })
    }

    return (
        <form onSubmit={props.submit} className="mb-6 flex gap-2">
            <input
                type="text"
                placeholder="Enter name"
                name="name"
                value={props.userInput?.name || ""}
                onChange={handleChange}
                className="flex-1 border border-gray-300 px-3 py-2 rounded"
                required={true}
            />
            <input
                type="email"
                placeholder="Enter email"
                name="email"
                value={props.userInput?.email || ""}
                onChange={handleChange}
                className="flex-1 border border-gray-300 px-3 py-2 rounded"
                required={true}
            />
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                {props.editUser ? 'Save' : 'Add'}
            </button>
            {props.editUser && (
                <button
                    type="button"
                    onClick={props.cancelEdit}
                    className="hover:underline bg-gray-300 px-4 py-2 rounded"
                >
                    Cancel
                </button>
            )}
        </form>
    )
}