import { Layers, Plus, GripVertical } from 'lucide-react';
import TaskStageForm from './TaskStageForm';
import type { TaskStage } from '../../../types/Tasks';
import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { useMutation } from '@apollo/client';
import { UPDATE_TASK_STAGE } from '../gql/workspace.graphql';

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
  const [stages, setStages] = useState<TaskStage[]>([]);
  const [updateTaskStage] = useMutation(UPDATE_TASK_STAGE);

  // Sync local state with props for optimistic drag updates
  useEffect(() => {
    // Sort by sequence just in case
    const sorted = [...(taskStages || [])].sort(
      (a, b) => (a.sequence || 0) - (b.sequence || 0),
    );
    setStages(sorted);
  }, [taskStages]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Optimistically reorder local state
    const newStages = Array.from(stages);
    const [movedStage] = newStages.splice(sourceIndex, 1);
    newStages.splice(destinationIndex, 0, movedStage);
    setStages(newStages);

    // Calculate new sequences and fire mutations
    try {
      const promises = newStages.map((stage, index) => {
        // Only update if sequence actually changed
        const newSequence = index + 1; // 1-indexed sequence
        if (stage.sequence !== newSequence) {
          return updateTaskStage({
            variables: {
              updateTaskStageInput: {
                id: stage.id,
                sequence: newSequence,
              },
            },
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      refetch();
    } catch (error) {
      console.error('Failed to update sequence', error);
      // Revert on error
      setStages(
        [...taskStages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
      );
    }
  };

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
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="task-stages">
            {(provided) => (
              <div
                className="space-y-2"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {stages.map((stage: TaskStage, index: number) => (
                  <Draggable
                    key={stage.id.toString()}
                    draggableId={stage.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center justify-between p-3 bg-white border rounded-lg group transition-all shadow-sm
                          ${snapshot.isDragging ? 'border-indigo-400 shadow-lg scale-[1.02] z-50' : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30'}
                        `}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="mr-3 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing px-1"
                        >
                          <GripVertical size={18} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <TaskStageForm stage={stage} refetch={refetch} />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {toAdd && (
          <div className="mt-4 flex items-center justify-between p-3 bg-white border border-indigo-200 rounded-lg shadow-sm">
            <TaskStageForm
              isNew={toAdd}
              onReset={() => setToAdd(false)}
              refetch={refetch}
            />
          </div>
        )}
      </div>
    </div>
  );
}
