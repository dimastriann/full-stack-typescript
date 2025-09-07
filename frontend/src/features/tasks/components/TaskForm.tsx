// features/tasks/components/TaskForm.tsx
import { useState } from 'react';
import useTasks from '../hooks/useTasks';
import useUsers from '../../users/hooks/useUsers';
import { useProjects } from '../../projects/hooks/useProjects';

export default function TaskForm({
  task,
  onSaved,
}: {
  task?: any;
  onSaved?: () => void;
}) {
  const isEdit = !!task?.id;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    userId: task?.userId || '',
    projectId: task?.projectId || '',
  });

  const { createTask, updateTask, refetch } = useTasks();
  const { users } = useUsers();
  const { projects } = useProjects();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // console.info("task", form)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      title: form.title,
      description: form.description,
      userId: Number(form.userId),
      projectId: Number(form.projectId),
    };
    if (isEdit) {
      await updateTask({ variables: { id: task.id, input } });
    } else {
      await createTask({ variables: { input } });
    }
    refetch();
    if (onSaved) onSaved();
    setForm({ title: '', description: '', userId: '', projectId: '' });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white shadow-md"
    >
      <h2 className="text-xl font-semibold">
        {isEdit ? 'Edit Task' : 'Create Task'}
      </h2>

      <input
        className="w-full border p-2 rounded"
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Task Title"
        required
      />

      <input
        className="w-full border p-2 rounded"
        type="text"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Task Description"
      />

      <select
        name="userId"
        value={form.userId}
        onChange={handleChange}
        required
        className="w-full border p-2 rounded"
      >
        <option value="">Select User</option>
        {users.map((u: any) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      <select
        name="projectId"
        value={form.projectId}
        onChange={handleChange}
        required
        className="w-full border p-2 rounded"
      >
        <option value="">Select Project</option>
        {projects.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {isEdit ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
