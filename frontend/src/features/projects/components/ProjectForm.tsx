import { usePorjects } from "../hooks/useProjects";
import type { ProjectType } from "../../../types/ProjectType";


type ProjectFormProps = {
    projectInput: ProjectType | null
    setProjectInput: Function
    // submit: (e: React.FormEvent) => void
    editingProject: ProjectType | null
    setEditingProject: Function
    cancelEdit?: () => void
}


export default function ProjectForm(props: ProjectFormProps) {
    const { updateProject, createProject, refetch } = usePorjects();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // console.info("event project", props.projectInput, props.editingProject)
        if (!props.projectInput?.name.trim()) {
            throw new Error("Please input project name correctly!")
        };
        if (props.editingProject) {
            if("__typename" in props.projectInput){
                delete props.projectInput.__typename;
            }
            await updateProject({ variables: { updateProjectInput: props.projectInput } });
            props.setEditingProject(null);
        } else {
            await createProject({ variables: { createProjectInput: props.projectInput } });
        }
        props.setProjectInput(null);
        refetch();
        // console.info("event project", projectInput)
    }

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        props.setProjectInput({ ...props.projectInput, [name]: value })
        // console.info("event project props", props)
    }


    return (

        <form
            onSubmit={handleSubmit}
            className="mb-6 flex flex-col gap-2"
        >
            <input
                type="text"
                placeholder="Project name"
                required={true}
                value={props.projectInput?.name || ""}
                onChange={handleChange}
                className="border px-3 py-2 rounded"
                name="name"
            />
            <textarea
                placeholder="Description"
                required={true}
                value={props.projectInput?.description || ""}
                onChange={handleChange}
                className="border px-3 py-2 rounded"
                name="description"
            />

            <div className="flex gap-2">
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    {props.editingProject ? 'Update Project' : 'Add Project'}
                </button>
                {props.editingProject && (
                    <button
                        type="button"
                        onClick={() => {
                            props.setEditingProject(null);
                            props.setProjectInput(null)
                        }}
                        className="text-gray-600 hover:underline"
                    >Cancel
                    </button>
                )}
            </div>
        </form>

    )
}