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
    return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">Timesheets</h3>
        <button
          onClick={handleAddRow}
          disabled={!!editingId}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Log
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Hours
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
                    type="date"
                    name="date"
                    value={editForm.date || ''}
                    onChange={handleChange}
                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    name="description"
                    value={editForm.description || ''}
                    onChange={handleChange}
                    placeholder="Description"
                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.1"
                    name="timeSpent"
                    value={editForm.timeSpent || 0}
                    onChange={handleChange}
                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                  />
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
            {timesheets.map((ts) => (
              <tr
                key={ts.id}
                className={
                  editingId === ts.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }
              >
                {editingId === ts.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        name="date"
                        value={editForm.date || ''}
                        onChange={handleChange}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        name="description"
                        value={editForm.description || ''}
                        onChange={handleChange}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.1"
                        name="timeSpent"
                        value={editForm.timeSpent || 0}
                        onChange={handleChange}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                      />
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
                      {new Date(ts.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {ts.description}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {ts.timeSpent}h
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditRow(ts)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => ts.id && handleDelete(ts.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
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
