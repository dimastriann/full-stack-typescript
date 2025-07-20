import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_USER, GET_USERS, UPDATE_USER, DELETE_USER } from "./user.graphql";
import UserList from "./UserList";
import UserForm from "./UserForm";
import type { User } from "../../types/Users";


export default function User() {
    const [userInput, setUserInput] = useState<User | null>(null);
    const [createUser] = useMutation(CREATE_USER);
    const { refetch } = useQuery(GET_USERS);
    const [updateUser] = useMutation(UPDATE_USER);
    const [deleteUser] = useMutation(DELETE_USER);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // console.info("info user", data)

    const resetPayload = () => {
        setUserInput(null);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('user submit', userInput)
        if (!userInput?.name.trim() || !userInput?.email.trim()) {
            throw new Error("Please input name and email correctly!")
        };
        if (editingUser) {
            await updateUser({ variables: {id: editingUser.id, ...userInput} });
            setEditingUser(null);
        } else {
            await createUser({ variables: { ...userInput } });
        }
        resetPayload();
        refetch();
    };

    const userEdit = (user: User) => {
        setEditingUser(user)
        setUserInput(user)
        console.info("user edit", user)
    }

    const cancelEdit = () => {
        setEditingUser(null)
        resetPayload()
    }

    const userDelete = async (user: User) => {
        await deleteUser({ variables: { id: user.id }});
        refetch();
    }

    return (
        <div className="p-6 max-w-xl mx-auto font-sans">
            <UserForm 
                userInput={userInput} 
                setUser={setUserInput} 
                submit={handleSubmit} 
                editUser={editingUser} 
                setEditUser={setEditingUser}
                cancelEdit={cancelEdit} />
            <UserList 
                editUser={userEdit} 
                deleteUser={userDelete} />
        </div>
    )
}