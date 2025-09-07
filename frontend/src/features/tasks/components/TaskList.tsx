// features/tasks/components/TaskList.tsx
import useTasks from '../hooks/useTasks';
import TaskForm from './TaskForm';
import { useState } from 'react';
// import { DnDialog } from '../../../components/Dialog';

export default function TaskList() {
  const { tasks, deleteTask, refetch } = useTasks();
  const [editing, setEditing] = useState<any | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask({ variables: { id } });
      refetch();
    }
  };

  return (
    <div className="p-4">
      <TaskForm onSaved={() => setEditing(null)} task={editing} />

      {/* <button>
        <DnDialog/>
      </button> */}

      <table className="w-full mt-6 border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Title</th>
            <th className="p-2 border">User</th>
            <th className="p-2 border">Project</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task: any) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="p-2 border">{task.title}</td>
              <td className="p-2 border">{task.user?.name}</td>
              <td className="p-2 border">{task.project?.name}</td>
              <td className="p-2 border">{task.status}</td>
              <td className="p-2 border text-center space-x-2">
                <button
                  onClick={() => setEditing(task)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
