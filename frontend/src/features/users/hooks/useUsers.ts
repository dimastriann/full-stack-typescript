import { useCallback } from "react"

type useUserType = {
    handleSubmit: (e: React.FormEvent) => void
}

export default function useUsers(): useUserType {

    const handleSubmit = useCallback( async (e: React.FormEvent) => {
        
    }, [])

    return {
        handleSubmit
    }
}