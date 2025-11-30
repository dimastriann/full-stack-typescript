import React, { useState, useMemo } from 'react';
import { useProjects } from '../hooks/useProjects';
import { ProjectStatus } from '../../../types/Projects';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import Modal from '../../../components/Dialog';
import ProjectForm from './ProjectForm';

const stages = [
  {
    id: ProjectStatus.DRAFT,
    title: 'Draft',
    color: 'bg-gray-100 border-gray-300',
    icon: Circle,
  },
  {
    id: ProjectStatus.IN_PROGRESS,
    title: 'In Progress',
    color: 'bg-blue-100 border-blue-300',
    icon: Clock,
  },
  {
    id: ProjectStatus.IN_REVIEW,
    title: 'In Review',
    color: 'bg-yellow-100 border-yellow-300',
    icon: AlertCircle,
  },
  {
    id: ProjectStatus.DONE,
    title: 'Done',
    color: 'bg-green-100 border-green-300',
    icon: CheckCircle,
  },
  {
    id: ProjectStatus.CANCELED,
    title: 'Canceled',
    color: 'bg-red-100 border-red-300',
    icon: XCircle,
  },
];

export default function ProjectKanban() {
  const {
    records,
    updateRecord,
    loading,
    error,
    pageSize,
    setPageSize,
    setEditingRecord,
    refetch,
  } = useProjects();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id'>('id');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      return (a.id || 0) - (b.id || 0);
    });
  }, [records, searchTerm, sortBy]);

  const onDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('id', `${id}`);
  };

  const onDrop = async (e: React.DragEvent, stage: ProjectStatus) => {
    const id = parseInt(e.dataTransfer.getData('id'));
    const project = records.find((p) => p.id === id);
    if (project && project.status !== stage) {
      try {
        await updateRecord({
          variables: {
            updateProjectInput: {
              id: project.id,
              status: stage,
            },
          },
        });
      } catch (err) {
        console.error('Failed to update status', err);
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
    <div className="flex flex-col h-full">
      <div className="mb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Projects Board</h2>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative inline-block text-left">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'id')}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              >
                <option value="id">Sort by ID</option>
                <option value="name">Sort by Name</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </div>

            <button
              onClick={() => setPageSize(pageSize + 20)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap"
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Load More
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto xl:ml-0">
            <button
              onClick={() => navigate('/dashboard/projects/list')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <List className="mr-2 h-4 w-4" />
              List
            </button>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto h-full pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-1 min-w-[300px] bg-gray-50 rounded-lg p-4 flex flex-col h-full"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage.id)}
          >
            <div
              className={`flex items-center gap-2 mb-4 p-3 rounded-md border ${stage.color}`}
            >
              <stage.icon size={20} className="text-gray-700" />
              <h2 className="font-semibold text-gray-800">{stage.title}</h2>
              <span className="ml-auto bg-white/50 px-2 py-0.5 rounded-full text-sm font-medium">
                {filteredRecords.filter((p) => p.status === stage.id).length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto min-h-[200px]">
              {filteredRecords
                .filter((project) => project.status === stage.id)
                .map((project) => (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) =>
                      project.id && onDragStart(e, project.id)
                    }
                    onClick={() => navigate(`/dashboard/project/${project.id}`)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>ID: {project.id}</span>
                      {project.responsible && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {project.responsible.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

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
