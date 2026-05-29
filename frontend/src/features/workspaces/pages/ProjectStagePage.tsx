import { Layers, Plus, GripVertical } from 'lucide-react';
import ProjectStageForm from './ProjectStageForm';
import type { ProjectStage } from '../../../types/Projects';
import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { useMutation } from '@apollo/client';
import { UPDATE_PROJECT_STAGE } from '../gql/workspace.graphql';

interface ProjectStagePageProps {
  projectStages: ProjectStage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: (...args: any[]) => any;
}

export default function ProjectStagePage({
  projectStages,
  refetch,
}: ProjectStagePageProps) {
  const [toAdd, setToAdd] = useState(false);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [updateProjectStage] = useMutation(UPDATE_PROJECT_STAGE);

  // Sync local state with props for optimistic drag updates
  useEffect(() => {
    // Sort by sequence just in case
    const sorted = [...(projectStages || [])].sort(
      (a, b) => (a.sequence || 0) - (b.sequence || 0),
    );
    setStages(sorted);
  }, [projectStages]);

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
          return updateProjectStage({
            variables: {
              updateProjectStageInput: {
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
        [...projectStages].sort(
          (a, b) => (a.sequence || 0) - (b.sequence || 0),
        ),
      );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl mb-8 overflow-hidden border border-surface-200 dark:border-slate-800">
      <div className="p-6 border-b border-surface-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Project Stages
          </h2>
        </div>
        <button
          onClick={() => setToAdd(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow transition-all"
        >
          <Plus className="mr-1 h-4 w-4" /> Add Stage
        </button>
      </div>
      <div className="p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="project-stages">
            {(provided) => (
              <div
                className="space-y-2"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {stages.map((stage: ProjectStage, index: number) => (
                  <Draggable
                    key={stage.id.toString()}
                    draggableId={stage.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center justify-between p-3 bg-white dark:bg-slate-900 border rounded-xl group transition-all shadow-sm
                          ${snapshot.isDragging ? 'border-primary-400 dark:border-primary-500 shadow-float scale-[1.02] z-50' : 'border-surface-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/30 dark:hover:bg-primary-900/10'}
                        `}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="mr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing px-1"
                        >
                          <GripVertical size={18} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <ProjectStageForm stage={stage} refetch={refetch} />
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
          <div className="mt-4 flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800 rounded-xl shadow-sm animate-slide-in-up">
            <ProjectStageForm
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
