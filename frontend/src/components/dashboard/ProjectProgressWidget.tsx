import { Link } from 'react-router-dom';
import { AlertCircle, Clock } from 'lucide-react';
import type { ProjectProgressItem } from '../../features/dashboard/types/dashboard.types';

interface Props {
  data: ProjectProgressItem[];
}

function BudgetBar({ planned, actual }: { planned: number; actual: number }) {
  if (planned === 0 && actual === 0) return null;
  const overBudget = actual > planned && planned > 0;
  const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;

  return (
    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
      <span className="flex items-center gap-1">
        {overBudget && <AlertCircle size={10} className="text-red-500" />}
        Budget: ${actual.toLocaleString()} / ${planned.toLocaleString()}
      </span>
      <div className="flex-1 h-1 bg-surface-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ProjectProgressWidget({ data }: Props) {
  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
          Project Progress
        </h3>
        <Link
          to="/dashboard/projects"
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
        >
          View all
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 dark:text-gray-600">
          <Clock size={32} strokeWidth={1.5} />
          <p className="text-sm">No active projects</p>
        </div>
      ) : (
        <ul className="space-y-5">
          {data.map((project) => {
            const pct = Math.min(Math.max(project.progress, 0), 100);
            const progressColor =
              pct >= 100
                ? 'from-emerald-400 to-emerald-600'
                : pct >= 60
                  ? 'from-primary-400 to-primary-600'
                  : pct >= 30
                    ? 'from-amber-400 to-amber-600'
                    : 'from-red-400 to-red-600';

            return (
              <li key={project.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <Link
                    to={`/dashboard/project/${project.id}`}
                    className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate max-w-[70%]"
                  >
                    {project.projectName}
                  </Link>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {pct.toFixed(0)}%
                  </span>
                </div>

                <div className="h-2 bg-surface-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <BudgetBar
                  planned={project.budgetPlanned}
                  actual={project.budgetActual}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
