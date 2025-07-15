import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_USER, GET_USERS, UPDATE_USER } from "./user.graphql";
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
    // const [createUser] = useMutation(CREATE_USER);
    // const { data, loading, error, refetch } = useQuery(GET_USERS);
    // const [updateUser] = useMutation(UPDATE_USER);
    // const [name, setName] = useState("");
    // const [email, setEmail] = useState("");
    

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

    const handleChange = (e: any) => {
        // console.info("change", e)
        // console.info("change", props.userInput)
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
            />
            <input
                type="email"
                placeholder="Enter email"
                name="email"
                value={props.userInput?.email || ""}
                onChange={handleChange}
                className="flex-1 border border-gray-300 px-3 py-2 rounded"
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