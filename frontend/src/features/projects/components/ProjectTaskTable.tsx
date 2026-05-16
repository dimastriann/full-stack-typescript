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
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { TaskPriority, TaskTypeEnum } from '../../../types/Tasks';
import type { TaskType, TaskStage } from '../../../types/Tasks';
import { Plus, Save, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Select from '../../../components/Select';

interface ProjectTaskTableProps {
  projectId: number | undefined;
}

export default function ProjectTaskTable({ projectId }: ProjectTaskTableProps) {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
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
      estimatedHours: 0,
      priority: TaskPriority.MEDIUM,
      type: TaskTypeEnum.TASK,
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
        estimatedHours: Number(editForm.estimatedHours || 0),
        priority: editForm.priority || TaskPriority.MEDIUM,
        type: editForm.type || TaskTypeEnum.TASK,
      };

      if (editForm.stageId) {
        input.stageId = Number(editForm.stageId);
      }

      if (editingId === 'new') {
        await createTask({
          variables: { input },
        });
      } else {
        await updateTask({
          variables: {
            input: { ...input, id: Number(editingId) },
          },
        });
      }
      await refetch();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      Logger.error('Failed to save task', error as Error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask({ variables: { id } });
        await refetch();
      } catch (error) {
        Logger.error('Failed to delete task', error as Error);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading)
    return (
      <div className="animate-pulse h-20 bg-gray-100 dark:bg-slate-800 rounded"></div>
    );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-surface-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="p-4 border-b border-surface-200 dark:border-slate-800 flex justify-between items-center bg-surface-50 dark:bg-slate-900/50">
        <h3 className="font-bold text-gray-900 dark:text-white">
          Project Tasks
        </h3>
        <button
          onClick={handleAddRow}
          disabled={!!editingId}
          className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all disabled:opacity-50"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Task
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-200 dark:divide-slate-800">
          <thead className="bg-surface-50 dark:bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Title
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Type
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Assignee
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Priority
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">
                Est.
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">
                Act.
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-surface-100 dark:divide-slate-800/50">
            {editingId === 'new' && (
              <tr className="bg-primary-50/50 dark:bg-primary-900/10">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="title"
                    value={editForm.title || ''}
                    onChange={handleChange}
                    placeholder="Task Title"
                    className="input-modern !p-1.5 !text-xs mb-1.5"
                  />
                  <input
                    type="text"
                    name="description"
                    value={editForm.description || ''}
                    onChange={handleChange}
                    placeholder="Description"
                    className="input-modern !p-1.5 !text-xs"
                  />
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={editForm.type || TaskTypeEnum.TASK}
                    onChange={(val) =>
                      setEditForm({ ...editForm, type: val as TaskTypeEnum })
                    }
                    options={Object.values(TaskTypeEnum).map((t) => ({
                      id: t,
                      label: t,
                    }))}
                    className="w-32"
                  />
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={editForm.userId || ''}
                    onChange={(val) =>
                      setEditForm({ ...editForm, userId: Number(val) })
                    }
                    options={
                      usersData?.users?.map((u: any) => ({
                        id: u.id.toString(),
                        label: u.name,
                      })) || []
                    }
                    placeholder="Select User"
                    className="w-36"
                  />
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={editForm.stageId || ''}
                    onChange={(val) =>
                      setEditForm({ ...editForm, stageId: Number(val) })
                    }
                    options={stages.map((s) => ({
                      id: s.id.toString(),
                      label: s.title,
                    }))}
                    placeholder="Select Stage"
                    className="w-32"
                  />
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={editForm.priority || TaskPriority.MEDIUM}
                    onChange={(val) =>
                      setEditForm({
                        ...editForm,
                        priority: val as TaskPriority,
                      })
                    }
                    options={Object.values(TaskPriority).map((p) => ({
                      id: p,
                      label: p,
                    }))}
                    className="w-32"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="estimatedHours"
                    value={editForm.estimatedHours || 0}
                    onChange={handleChange}
                    className="input-modern !p-1.5 !text-xs text-center"
                  />
                </td>
                <td className="px-4 py-3 text-center dark:text-gray-500">-</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSave}
                      className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {tasks.map((task) => (
              <tr
                key={task.id}
                className={
                  editingId === task.id
                    ? 'bg-primary-50/50 dark:bg-primary-900/10'
                    : 'hover:bg-surface-50 dark:hover:bg-slate-800/50 transition-colors'
                }
              >
                {editingId === task.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        name="title"
                        value={editForm.title || ''}
                        onChange={handleChange}
                        className="input-modern !p-1.5 !text-xs mb-1.5"
                      />
                      <input
                        type="text"
                        name="description"
                        value={editForm.description || ''}
                        onChange={handleChange}
                        className="input-modern !p-1.5 !text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={editForm.type || TaskTypeEnum.TASK}
                        onChange={(val) =>
                          setEditForm({
                            ...editForm,
                            type: val as TaskTypeEnum,
                          })
                        }
                        options={Object.values(TaskTypeEnum).map((t) => ({
                          id: t,
                          label: t,
                        }))}
                        className="w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={editForm.userId || ''}
                        onChange={(val) =>
                          setEditForm({ ...editForm, userId: Number(val) })
                        }
                        options={
                          usersData?.users?.map((u: any) => ({
                            id: u.id.toString(),
                            label: u.name,
                          })) || []
                        }
                        placeholder="Select User"
                        className="w-36"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={editForm.stageId || ''}
                        onChange={(val) =>
                          setEditForm({ ...editForm, stageId: Number(val) })
                        }
                        options={stages.map((s) => ({
                          id: s.id.toString(),
                          label: s.title,
                        }))}
                        placeholder="Select Stage"
                        className="w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={editForm.priority || TaskPriority.MEDIUM}
                        onChange={(val) =>
                          setEditForm({
                            ...editForm,
                            priority: val as TaskPriority,
                          })
                        }
                        options={Object.values(TaskPriority).map((p) => ({
                          id: p,
                          label: p,
                        }))}
                        className="w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        name="estimatedHours"
                        value={editForm.estimatedHours || 0}
                        onChange={handleChange}
                        className="input-modern !p-1.5 !text-xs text-center"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 text-center">
                      {task.actualHours || 0}h
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleSave}
                          className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      <div className="font-bold">{task.title}</div>
                      <div className="text-gray-500 dark:text-gray-500 text-[11px] truncate max-w-[200px] mt-0.5">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          task.type === 'BUG'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : task.type === 'STORY'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : task.type === 'EPIC'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        }`}
                      >
                        {task.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {task.user?.name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-colors
                        ${
                          task.stage?.isCompleted
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        }`}
                      >
                        {task.stage?.title || 'No Stage'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          task.priority === 'URGENT'
                            ? 'bg-red-500 text-white'
                            : task.priority === 'HIGH'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                              : task.priority === 'MEDIUM'
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                : 'bg-surface-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center font-mono">
                      {task.estimatedHours}h
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center font-mono">
                      {task.actualHours || 0}h
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/dashboard/task/${task.id}`)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditRow(task)}
                          className="px-2.5 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => task.id && handleDelete(task.id)}
                          className="px-2.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {tasks.length === 0 && editingId !== 'new' && (
              <tr>
                <td
                  colSpan={7}
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
