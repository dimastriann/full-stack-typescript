import React, { useState } from 'react';
import { Mail, CheckCircle, Star, CircleIcon, CheckCheck } from 'lucide-react';

type Task = {
  id: number;
  title: string;
  project: string;
  stage: string;
  description: string;
  user: string;
  email?: string;
  endDate?: string;
  userAvatar?: string;
  priority?: number;
  completed?: boolean;
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Setup project repo',
    project: 'Simple App',
    user: 'Ahmad',
    description: 'Create GitHub repository and setup CI/CD',
    stage: 'todo',
    userAvatar: 'https://i.pravatar.cc/40?img=1',
    endDate: '2025-08-17',
    priority: 4,
    completed: false,
  },
  {
    id: 2,
    title: 'Design homepage',
    project: 'Simple App',
    user: 'Mustofa',
    description: 'Figma design for landing page',
    stage: 'progress',
    userAvatar: 'https://i.pravatar.cc/40?img=2',
    endDate: '2025-08-17',
    priority: 3,
    completed: false,
  },
  {
    id: 3,
    title: 'Implement login',
    project: 'Simple App',
    user: 'Zahir',
    description: 'Create login API & frontend form',
    stage: 'review',
    userAvatar: 'https://i.pravatar.cc/40?img=3',
    endDate: '2025-08-17',
    priority: 5,
    completed: true,
  },
  {
    id: 4,
    title: 'Deploy v1.0',
    project: 'Simple App',
    user: 'Zulkifli',
    description: 'Deploy to production server',
    stage: 'done',
    userAvatar: 'https://i.pravatar.cc/40?img=4',
    endDate: '2025-08-17',
    priority: 3,
    completed: true,
  },
  {
    id: 5,
    title: 'User profile page',
    project: 'Simple App',
    user: 'Dermawan',
    description: 'Build and style profile page',
    stage: 'progress',
    userAvatar: 'https://i.pravatar.cc/40?img=5',
    endDate: '2025-08-17',
    priority: 2,
    completed: true,
  },
];

const stages = [
  { id: 'todo', title: 'Todo', color: 'bg-gray-100 border-gray-300' },
  {
    id: 'progress',
    title: 'In Progress',
    color: 'bg-blue-100 border-blue-300',
  },
  { id: 'review', title: 'Review', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'done', title: 'Done', color: 'bg-green-100 border-green-300' },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const onDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('id', `${id}`);
  };

  const onDrop = (e: React.DragEvent, stage: string) => {
    const id = e.dataTransfer.getData('id');
    setTasks((prev) =>
      prev.map((task) =>
        task.id === parseInt(id) ? { ...task, stage } : task,
      ),
    );
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex gap-4 overflow-x-auto">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className={`flex-1 min-w-[250px] bg-gray-100 rounded-lg p-4 pt-0`}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, stage.id)}
        >
          <h2
            className={`ext-lg font-semibold mb-3 py-2 px-1 text-center shadow-md rounded-sm ${stage.color}`}
          >
            {stage.title}
          </h2>
          <div className="flex-1 p-2 space-y-3 overflow-y-auto">
            {tasks
              .filter((task) => task.stage === stage.id)
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, task.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col gap-2 cursor-grab"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        <CheckCheck className="inline" /> {task.project}
                      </p>
                      <p className="text-sm text-gray-600">
                        {task.description}
                      </p>
                    </div>
                    {task.email && (
                      <Mail size={18} className="text-blue-500 mt-1" />
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i <= (task.priority || 4)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Due: {task.endDate}</span>
                    <img
                      src={task.userAvatar}
                      alt="avatar"
                      className="w-6 h-6 rounded-full"
                    />
                  </div>

                  <div className="flex justify-end">
                    {task.completed ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <CircleIcon size={'1.3rem'} />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
