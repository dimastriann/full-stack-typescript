import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_TIMESHEETS,
  CREATE_TIMESHEET,
  UPDATE_TIMESHEET,
  DELETE_TIMESHEET,
} from '../../timesheets/gql/timesheet.graphql';
import type { TimesheetType } from '../../../types/Timesheets';
import { Plus, Save, X } from 'lucide-react';
import Logger from '../../../lib/logger';

interface TaskTimesheetTableProps {
  taskId: number;
  userId: number;
  projectId: number;
}

export default function TaskTimesheetTable({
  taskId,
  userId,
  projectId,
}: TaskTimesheetTableProps) {
  const { data, loading, refetch } = useQuery(GET_TIMESHEETS, {
    variables: { taskId },
    skip: !taskId,
  });

  const [createTimesheet] = useMutation(CREATE_TIMESHEET);
  const [updateTimesheet] = useMutation(UPDATE_TIMESHEET);
  const [deleteTimesheet] = useMutation(DELETE_TIMESHEET);

  const [timesheets, setTimesheets] = useState<TimesheetType[]>([]);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [editForm, setEditForm] = useState<Partial<TimesheetType>>({});

  useEffect(() => {
    if (data?.timesheets) {
      setTimesheets(data.timesheets);
    }
  }, [data]);

  const handleAddRow = () => {
    if (editingId === 'new') return;
    setEditingId('new');
    setEditForm({
      description: '',
      date: new Date().toISOString().split('T')[0],
      timeSpent: 0,
      userId,
      projectId,
      taskId,
    });
  };

  const handleEditRow = (ts: TimesheetType) => {
    if (editingId) return; // Prevent multiple edits
    setEditingId(ts.id || null);
    setEditForm({
      ...ts,
      date: new Date(ts.date).toISOString().split('T')[0],
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    try {
      const input = {
        ...editForm,
        timeSpent: Number(editForm.timeSpent),
        userId: Number(editForm.userId),
        projectId: Number(editForm.projectId),
        taskId: Number(editForm.taskId),
        date: new Date(editForm.date || '').toISOString(),
      };

      if (editingId === 'new') {
        await createTimesheet({ variables: { input } });
      } else {
        await updateTimesheet({
          variables: { input: { ...input, id: editingId } },
        });
      }
      await refetch();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      Logger.error('Failed to save timesheet', error as any);
      alert('Failed to save timesheet: ' + error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this timesheet?')) {
      try {
        await deleteTimesheet({ variables: { id } });
        await refetch();
      } catch (error) {
        Logger.error('Failed to delete timesheet', error as any);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading)
    return (
      <div className="animate-pulse h-20 bg-gray-100 dark:bg-slate-800 rounded"></div>
    );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-surface-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="p-4 border-b border-surface-200 dark:border-slate-800 flex justify-between items-center bg-surface-50 dark:bg-slate-900/50">
        <h3 className="font-bold text-gray-900 dark:text-white">Timesheets</h3>
        <button
          onClick={handleAddRow}
          disabled={!!editingId}
          className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all disabled:opacity-50"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Log
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-200 dark:divide-slate-800">
          <thead className="bg-surface-50 dark:bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Date
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Description
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest w-24">
                Hours
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
                    type="date"
                    name="date"
                    value={editForm.date || ''}
                    onChange={handleChange}
                    className="input-modern !p-1.5 !text-xs"
                  />
                </td>
                <td className="px-4 py-3">
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
                  <input
                    type="number"
                    step="0.1"
                    name="timeSpent"
                    value={editForm.timeSpent || 0}
                    onChange={handleChange}
                    className="input-modern !p-1.5 !text-xs text-center"
                  />
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
              </tr>
            )}
            {timesheets.map((ts) => (
              <tr
                key={ts.id}
                className={
                  editingId === ts.id
                    ? 'bg-primary-50/50 dark:bg-primary-900/10'
                    : 'hover:bg-surface-50 dark:hover:bg-slate-800/50 transition-colors'
                }
              >
                {editingId === ts.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        name="date"
                        value={editForm.date || ''}
                        onChange={handleChange}
                        className="input-modern !p-1.5 !text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        name="description"
                        value={editForm.description || ''}
                        onChange={handleChange}
                        className="input-modern !p-1.5 !text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        name="timeSpent"
                        value={editForm.timeSpent || 0}
                        onChange={handleChange}
                        className="input-modern !p-1.5 !text-xs text-center"
                      />
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
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                      {new Date(ts.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {ts.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {ts.timeSpent}h
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleEditRow(ts)}
                          className="px-2.5 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => ts.id && handleDelete(ts.id)}
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
            {timesheets.length === 0 && editingId !== 'new' && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  No timesheets logged for this task.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
