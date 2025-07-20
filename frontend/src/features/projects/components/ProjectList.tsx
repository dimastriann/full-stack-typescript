import { usePorjects } from "../hooks/useProjects";

export default function ProjectList(props: {editProject: Function, setProjectInput: Function}): React.ReactElement {
    const { projects, loading, error, refetch, deleteProject } = usePorjects();

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            {/* Table */}
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p>Error fetching users</p>
            ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 border text-left">ID</th>
                            <th className="px-4 py-2 border text-left">Name</th>
                            <th className="px-4 py-2 border text-left">Description</th>
                            <th className="px-4 py-2 border text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project: any) => (
                            <tr key={project.id} className="hover:bg-gray-50">
                                <td className="border px-4 py-2">{project.id}</td>
                                <td className="border px-4 py-2">{project.name}</td>
                                <td className="border px-4 py-2">{project.description}</td>
                                <td className="border px-4 py-2 space-x-2">
                                    <button
                                        onClick={() => {
                                            props.editProject(project);
                                            props.setProjectInput(project);
                                            // setProjectDesc(project.description || '');
                                        }}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Delete project "${project.name}"?`)) {
                                              await deleteProject({ variables: { id: project.id } });
                                              refetch();
                                            }
                                        }}
                                        className="text-red-600 hover:underline"
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