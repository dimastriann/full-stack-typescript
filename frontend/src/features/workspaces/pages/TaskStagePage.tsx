import { Layers, Plus } from 'lucide-react';
import TaskStageForm from './TaskStageForm';
import type { TaskStage } from '../../../types/Tasks';
import { useState } from 'react';

interface TaskStagePageProps {
  taskStages: TaskStage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: (...args: any[]) => any;
}

export default function TaskStagePage({
  taskStages,
  refetch,
}: TaskStagePageProps) {
  const [toAdd, setToAdd] = useState(false);
  return (
    <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Task Stages</h2>
        </div>
        <button
          onClick={() => setToAdd(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="mr-1 h-4 w-4" /> Add Stage
        </button>
      </div>
      <div className="p-6">
        <div className="space-y-2">
          {taskStages?.map((stage: TaskStage) => (
            <div
              key={stage.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all shadow-sm"
            >
              <TaskStageForm stage={stage} refetch={refetch} />
            </div>
          ))}
          {toAdd && (
            <TaskStageForm
              isNew={toAdd}
              onReset={() => setToAdd(false)}
              refetch={refetch}
            />
          )}
        </div>
      </div>
    </div>
  );
}
