import { useProjects } from '../hooks/useProjects';
import type { ProjectType } from '../../../types/Projects';
import { ApolloError } from '@apollo/client';

type ProjectListProps = {
  projects: ProjectType[];
  loading: boolean;
  error: ApolloError | undefined;
  editProject: Function;
  setProjectInput: Function;
};

export default function ProjectList(
  props: ProjectListProps,
): React.ReactElement {
  const { refetch, deleteProject } = useProjects();

  if (props.loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Table */}
      {props.loading ? (
        <p>Loading...</p>
      ) : props.error ? (
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
            {props.projects.map((project: ProjectType) => (
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
  );
}
