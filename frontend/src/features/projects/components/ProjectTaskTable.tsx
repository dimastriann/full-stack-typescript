import React, { useState, useEffect } from 'react';
import Logger from '../../../lib/logger';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_TASKS,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  GET_TASK_STAGES,
} from '../../tasks/gql/task.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';
import { useWorkspace } from '../../../context/WorkspaceProvider';
import type { TaskType, TaskStage } from '../../../types/Tasks';
import { Plus, Save, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectTaskTableProps {
  projectId: number | undefined;
}

export default function ProjectTaskTable({ projectId }: ProjectTaskTableProps) {
  const { activeWorkspace } = useWorkspace();
  const { data, loading, refetch } = useQuery(GET_TASKS, {
    variables: { projectId },
    skip: !projectId,
  });
  const { data: usersData } = useQuery(GET_USERS);
  const { data: stagesData } = useQuery(GET_TASK_STAGES, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });

  const stages: TaskStage[] = stagesData?.taskStages ?? [];

  const [createTask] = useMutation(CREATE_TASK);
  const [updateTask] = useMutation(UPDATE_TASK);
  const [deleteTask] = useMutation(DELETE_TASK);

  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [editForm, setEditForm] = useState<Partial<TaskType>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (data?.tasks) {
      setTasks(data.tasks);
    }
  }, [data]);

  const handleAddRow = () => {
    if (editingId === 'new') return;
    setEditingId('new');
    setEditForm({
      title: '',
      description: '',
      userId: undefined,
      projectId: Number(projectId),
    });
  };

  const handleEditRow = (task: TaskType) => {
    if (editingId) return;
    setEditingId(task.id || null);
    setEditForm({
      ...task,
      userId: task.user?.id || task.userId,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    try {
      const input: any = {
        title: editForm.title,
        description: editForm.description,
        projectId: Number(projectId),
        userId: Number(editForm.userId),
      };

      if (editForm.stageId) {
        input.stageId = Number(editForm.stageId);
      }

      if (editingId === 'new') {
        await createTask({ variables: { createTaskInput: input } });
      } else {
        await updateTask({
          variables: {
            updateTaskInput: { ...input, id: Number(editingId) },
          },
        });
      }
      await refetch();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      Logger.error('Failed to save task', error as any);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask({ variables: { id } });
        await refetch();
      } catch (error) {
        Logger.error('Failed to delete task', error as any);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading)
    return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">Project Tasks</h3>
        <button
          onClick={handleAddRow}
          disabled={!!editingId}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Task
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editingId === 'new' && (
              <tr className="bg-indigo-50">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    name="title"
                    value={editForm.title || ''}
                    onChange={handleChange}
                    placeholder="Task Title"
                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                  />
                  <input
                    type="text"
                    name="description"
                    value={editForm.description || ''}
                    onChange={handleChange}
                    placeholder="Description"
                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border mt-1"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    name="userId"
                    value={editForm.userId || ''}
                    onChange={handleChange}
                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                  >
                    <option value="">Select User</option>
                    {usersData?.users?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    name="stageId"
                    value={editForm.stageId || ''}
                    onChange={handleChange}
                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                  >
                    <option value="">Select Stage</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={handleSave}
                    className="text-green-600 hover:text-green-900 mr-2"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-red-600 hover:text-red-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )}
            {tasks.map((task) => (
              <tr
                key={task.id}
                className={
                  editingId === task.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }
              >
                {editingId === task.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        name="title"
                        value={editForm.title || ''}
                        onChange={handleChange}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                      />
                      <input
                        type="text"
                        name="description"
                        value={editForm.description || ''}
                        onChange={handleChange}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border mt-1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        name="userId"
                        value={editForm.userId || ''}
                        onChange={handleChange}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                      >
                        <option value="">Select User</option>
                        {usersData?.users?.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        name="stageId"
                        value={editForm.stageId || ''}
                        onChange={handleChange}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                      >
                        <option value="">Select Stage</option>
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={handleSave}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[200px]">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {task.user?.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      <span
                        className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full
                        ${
                          task.stage?.isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {task.stage?.title || 'No Stage'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/dashboard/task/${task.id}`)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditRow(task)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => task.id && handleDelete(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {tasks.length === 0 && editingId !== 'new' && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  No tasks found for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
