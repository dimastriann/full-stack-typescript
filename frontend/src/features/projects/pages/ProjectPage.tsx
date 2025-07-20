import React from "react";
import ProjectForm from "../components/ProjectForm";
import ProjectList from "../components/ProjectList";
import { usePorjects } from "../hooks/useProjects";


export default function ProjectPage(): React.ReactElement {
    const { projectInput, setProjectInput, setEditingProject, editingProject } = usePorjects();

    return (
        <div className="p-6 max-w-xl mx-auto font-sans">
            <h2 className="text-xl font-bold mt-10 mb-2">Projects</h2>
            <ProjectForm projectInput={projectInput} setProjectInput={setProjectInput} editingProject={editingProject} setEditingProject={setEditingProject} />
            <ProjectList editProject={setEditingProject} setProjectInput={setProjectInput} />
        </div>
    )
}