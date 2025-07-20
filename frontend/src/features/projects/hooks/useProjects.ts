import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_PROJECT, DELETE_PROJECT, UPDATE_PROJECT, GET_PROJECTS } from "../gql/project.graphql";
import type { ProjectType } from "../../../types/ProjectType";


export function usePorjects() {
    const {data, loading, error, refetch} = useQuery(GET_PROJECTS);
    const [createProject] = useMutation(CREATE_PROJECT);
    const [updateProject] = useMutation(UPDATE_PROJECT);
    const [deleteProject] = useMutation(DELETE_PROJECT);
    const [projectInput, setProjectInput] = useState<ProjectType | null>(null);
    const [editingProject, setEditingProject] = useState<ProjectType | null>(null)

    // console.info("query",data)

    // console.info("event project", projectInput)

    return {
        projects: (data?.projects || []),
        loading,
        error,
        refetch,
        projectInput,
        setProjectInput,
        createProject,
        updateProject,
        deleteProject,
        editingProject,
        setEditingProject
    }
}