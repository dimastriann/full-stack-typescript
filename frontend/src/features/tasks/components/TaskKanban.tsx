import { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_TASK_STAGES } from '../gql/task.graphql';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import {
  CheckCircle,
  Circle,
  Clock,
  XCircle,
  List,
  Plus,
  Search,
  ChevronDown,
  Rocket,
  TestTube,
  FileEdit,
  User,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import Modal from '../../../components/Dialog';
import Logger from '../../../lib/logger';
import TaskForm from './TaskForm';
import Select from '../../../components/Select';
import type { TaskStage } from '../../../types/Tasks';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

const getStageStyles = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('todo') || t.includes('to do'))
    return {
      icon: Circle,
      color: 'text-gray-500 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-slate-800',
    };
  if (t.includes('progress') || t.includes('active'))
    return {
      icon: Clock,
      color: 'text-blue-500 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    };
  if (t.includes('deployed') || t.includes('released'))
    return {
      icon: Rocket,
      color: 'text-purple-500 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    };
  if (t.includes('testing') || t.includes('test'))
    return {
      icon: TestTube,
      color: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    };
  if (t.includes('revision') || t.includes('fix'))
    return {
      icon: FileEdit,
      color: 'text-yellow-500 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    };
  if (t.includes('done') || t.includes('complete') || t.includes('finished'))
    return {
      icon: CheckCircle,
      color: 'text-green-500 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    };
  if (t.includes('cancel') || t.includes('removed'))
    return {
      icon: XCircle,
      color: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    };

  return {
    icon: List,
    color: 'text-primary-500 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
  };
};

export default function TaskKanban() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const { data: stagesData } = useQuery(GET_TASK_STAGES, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });

  const {
    records,
    updateRecord,
    loading,
    error,
    pageSize,
    setPageSize,
    setEditingRecord,
    setRecords,
    refetch,
  } = useTasks();

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'id' | 'sequence'>('sequence');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const stages: TaskStage[] = stagesData?.taskStages ?? [];

  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(lowerTerm) ||
          t.description?.toLowerCase().includes(lowerTerm),
      );
    }

    return result.sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'sequence') {
        return (a.sequence || 0) - (b.sequence || 0);
      }
      return (a.id || 0) - (b.id || 0);
    });
  }, [records, searchTerm, sortBy]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId);
    const targetStageId = parseInt(destination.droppableId);

    // Get tasks in target stage to calculate sequence
    const stageTasks = filteredRecords
      .filter((t) => t.stageId === targetStageId)
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    // Remove the moving task from the list if it's already there (moving within same stage)
    const filteredStageTasks = stageTasks.filter((t) => t.id !== taskId);

    let newSequence = 1000;

    if (filteredStageTasks.length === 0) {
      newSequence = 1000;
    } else if (destination.index === 0) {
      newSequence = (filteredStageTasks[0].sequence || 0) / 2;
    } else if (destination.index >= filteredStageTasks.length) {
      newSequence =
        (filteredStageTasks[filteredStageTasks.length - 1].sequence || 0) +
        1000;
    } else {
      const prev = filteredStageTasks[destination.index - 1];
      const next = filteredStageTasks[destination.index];
      newSequence = ((prev.sequence || 0) + (next.sequence || 0)) / 2;
    }

    const roundedSequence = Math.round(newSequence);

    // Optimistic UI Update
    const newRecords = records.map((t) => {
      if (t.id === taskId) {
        return { ...t, stageId: targetStageId, sequence: roundedSequence };
      }
      return t;
    });
    setRecords(newRecords);

    try {
      await updateRecord({
        variables: {
          input: {
            id: taskId,
            stageId: targetStageId,
            sequence: roundedSequence,
          },
        },
      });
      await refetch();
    } catch (err) {
      Logger.error('Failed to update task position', err as Error);
      // Revert on error
      setRecords(records);
      alert('Failed to update task position. Please try again.');
    }
  };

  const handleCreateClick = () => {
    setEditingRecord(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = async () => {
    await refetch();
    setIsCreateModalOpen(false);
  };

  if (loading && records.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        Error: {error.message}
      </div>
    );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-surface-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-xl">
            <List className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Tasks Board
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="input-modern pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as 'title' | 'id' | 'sequence')}
              options={[
                { id: 'sequence', label: 'Custom Order' },
                { id: 'id', label: 'Sort by ID' },
                { id: 'title', label: 'Sort by Title' },
              ]}
              className="w-full sm:w-44"
            />

            <button
              onClick={() => setPageSize(pageSize + 20)}
              className="inline-flex items-center px-4 py-2 border border-surface-200 dark:border-slate-800 rounded-xl shadow-xs text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-surface-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              More
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto xl:ml-0">
            <button
              onClick={() => navigate('/dashboard/tasks/list')}
              className="inline-flex items-center px-4 py-2 border border-surface-200 dark:border-slate-800 rounded-xl shadow-xs text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-surface-50 dark:hover:bg-slate-800 transition-colors"
            >
              <List className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              List
            </button>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto h-full pb-6 scrollbar-thin scrollbar-thumb-surface-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {stages.map((stage) => {
            const { icon: StageIcon, color, bg } = getStageStyles(stage.title);
            const stageTasks = filteredRecords.filter(
              (t) => t.stageId === stage.id,
            );

            return (
              <div
                key={stage.id}
                className="flex-none w-[320px] bg-surface-100/50 dark:bg-slate-900/30 rounded-2xl flex flex-col h-full border border-surface-200 dark:border-slate-800/50"
              >
                <div className="p-4 flex items-center justify-between border-b border-surface-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 rounded-t-2xl backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-2.5">
                    <div className={`${bg} p-1.5 rounded-lg transition-colors`}>
                      <StageIcon size={18} className={color} />
                    </div>
                    <h2 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                      {stage.title}
                    </h2>
                    <span className="bg-surface-200/50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[11px] font-bold">
                      {stageTasks.length}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>

                <Droppable droppableId={stage.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px] transition-colors duration-200 no-scrollbar ${
                        snapshot.isDraggingOver
                          ? 'bg-primary-50/50 dark:bg-primary-900/10'
                          : ''
                      }`}
                    >
                      {stageTasks.map((task, index) => (
                        <Draggable
                          key={task.id!.toString()}
                          draggableId={task.id!.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() =>
                                navigate(`/dashboard/task/${task.id}`)
                              }
                              className={`bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-surface-200 dark:border-slate-800 transition-all group hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md ${
                                snapshot.isDragging
                                  ? 'shadow-2xl border-primary-400 dark:border-primary-500 rotate-1 scale-105 z-50'
                                  : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col gap-1">
                                  <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                                    {task.title}
                                  </h3>
                                  <span className="text-[10px] text-primary-500 dark:text-primary-400 font-black uppercase tracking-wider">
                                    {task.type}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                    task.priority === 'URGENT'
                                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                      : task.priority === 'HIGH'
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                        : task.priority === 'MEDIUM'
                                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                          : 'bg-surface-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </div>

                              {task.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                  <BarChart2
                                    size={12}
                                    className="text-primary-500"
                                  />
                                  <span className="font-medium">
                                    {task.actualHours || 0} /{' '}
                                    {task.estimatedHours || 0}h
                                  </span>
                                </div>
                                {task.dueDate && (
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                    <AlertCircle
                                      size={12}
                                      className="text-primary-500"
                                    />
                                    <span className="font-medium">
                                      {new Date(
                                        task.dueDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-surface-50 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                  <div className="bg-surface-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <User
                                      size={12}
                                      className="text-gray-500 dark:text-gray-400"
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tighter">
                                    {task.user?.name || 'Unassigned'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-surface-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md">
                                  #{task.id}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
      >
        <TaskForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
