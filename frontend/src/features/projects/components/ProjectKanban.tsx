import { useState, useMemo } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PROJECT_STAGES } from '../gql/project.graphql';
import { useWorkspace } from '../../../context/WorkspaceProvider';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  List,
  Plus,
  Search,
  ArrowUpDown,
  ChevronDown,
  User,
} from 'lucide-react';
import Modal from '../../../components/Dialog';
import ProjectForm from './ProjectForm';
import type { ProjectStage } from '../../../types/Projects';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

const getStageStyles = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('draft') || t.includes('todo') || t.includes('to do'))
    return { icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100' };
  if (t.includes('progress') || t.includes('active'))
    return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' };
  if (t.includes('review') || t.includes('test'))
    return { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' };
  if (t.includes('done') || t.includes('complete') || t.includes('finished'))
    return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' };
  if (t.includes('cancel') || t.includes('archived') || t.includes('archive'))
    return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' };

  return { icon: List, color: 'text-indigo-500', bg: 'bg-indigo-50' };
};

export default function ProjectKanban() {
  const { activeWorkspace } = useWorkspace();
  const { data: stagesData } = useQuery(GET_PROJECT_STAGES, {
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
  } = useProjects();

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'sequence'>('sequence');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const stages: ProjectStage[] = stagesData?.projectStages ?? [];

  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(lowerTerm) ||
          p.description?.toLowerCase().includes(lowerTerm),
      );
    }

    return result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
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

    const projectId = parseInt(draggableId);
    const targetStageId = parseInt(destination.droppableId);

    // Get projects in target stage to calculate sequence
    const stageProjects = filteredRecords
      .filter((p) => p.stageId === targetStageId)
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    // Remove the moving project from the list if it's already there (moving within same stage)
    const filteredStageProjects = stageProjects.filter(
      (p) => p.id !== projectId,
    );

    let newSequence = 1000;

    if (filteredStageProjects.length === 0) {
      newSequence = 1000;
    } else if (destination.index === 0) {
      newSequence = (filteredStageProjects[0].sequence || 0) / 2;
    } else if (destination.index >= filteredStageProjects.length) {
      newSequence =
        (filteredStageProjects[filteredStageProjects.length - 1].sequence ||
          0) + 1000;
    } else {
      const prev = filteredStageProjects[destination.index - 1];
      const next = filteredStageProjects[destination.index];
      newSequence = ((prev.sequence || 0) + (next.sequence || 0)) / 2;
    }

    const roundedSequence = Math.round(newSequence);

    // Optimistic UI Update
    const newRecords = records.map((p) => {
      if (p.id === projectId) {
        return { ...p, stageId: targetStageId, sequence: roundedSequence };
      }
      return p;
    });
    setRecords(newRecords);

    try {
      await updateRecord({
        variables: {
          updateProjectInput: {
            id: projectId,
            stageId: targetStageId,
            sequence: roundedSequence,
          },
        },
      });
      // We don't necessarily need to refetch immediately if we are confident in our optimistic update,
      // but it's safer to let Apollo handle the sync afterwards.
      await refetch();
    } catch (err) {
      console.error('Failed to update project position', err);
      // Revert on error
      setRecords(records);
      alert('Failed to update project position. Please try again.');
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600">Error: {error.message}</div>
    );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <List className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Project Board
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative inline-block text-left w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500 appearance-none outline-none cursor-pointer"
              >
                <option value="sequence">Custom Order</option>
                <option value="id">Sort by ID</option>
                <option value="name">Sort by Name</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </div>

            <button
              onClick={() => setPageSize(pageSize + 20)}
              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg shadow-xs text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              More
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto xl:ml-0">
            <button
              onClick={() => navigate('/dashboard/projects/list')}
              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg shadow-xs text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <List className="mr-2 h-4 w-4 text-gray-500" />
              List
            </button>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto h-full pb-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {stages.map((stage) => {
            const { icon: StageIcon, color, bg } = getStageStyles(stage.title);
            const stageProjects = filteredRecords.filter(
              (p) => p.stageId === stage.id,
            );

            return (
              <div
                key={stage.id}
                className="flex-none w-[320px] bg-gray-100/50 rounded-xl flex flex-col h-full border border-gray-200/50"
              >
                <div className="p-4 flex items-center justify-between border-b border-gray-200/50 bg-white/80 rounded-t-xl backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-2.5">
                    <div className={`${bg} p-1.5 rounded-md`}>
                      <StageIcon size={18} className={color} />
                    </div>
                    <h2 className="font-bold text-gray-800 text-sm">
                      {stage.title}
                    </h2>
                    <span className="bg-gray-200/50 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-bold">
                      {stageProjects.length}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>

                <Droppable droppableId={stage.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px] transition-colors duration-200 ${
                        snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      {stageProjects.map((project, index) => (
                        <Draggable
                          key={project.id!.toString()}
                          draggableId={project.id!.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => {
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() =>
                                  navigate(`/dashboard/project/${project.id}`)
                                }
                                className={`bg-white p-4 rounded-xl shadow-xs border border-gray-200 transition-all group hover:border-indigo-300 hover:shadow-md ${
                                  snapshot.isDragging
                                    ? 'shadow-2xl border-indigo-400 rotate-1 scale-105 z-50'
                                    : ''
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {project.name}
                                  </h3>
                                </div>

                                {project.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                    {project.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                  <div className="flex items-center gap-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                    <div className="bg-gray-100 p-1 rounded">
                                      <User
                                        size={12}
                                        className="text-gray-500"
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                                      {project.responsible?.name ||
                                        'Unassigned'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                    #{project.id}
                                  </span>
                                </div>
                              </div>
                            );
                          }}
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
        title="Create New Project"
      >
        <ProjectForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
