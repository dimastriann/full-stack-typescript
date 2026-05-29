import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TasksByStageItem } from '../../features/dashboard/types/dashboard.types';

interface Props {
  data: TasksByStageItem[];
}

const FALLBACK_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

interface TooltipPayloadEntry {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-float text-sm">
      <p className="font-semibold text-gray-800 dark:text-white">
        {payload[0].name}
      </p>
      <p className="text-primary-600 dark:text-primary-400 font-bold">
        {payload[0].value} tasks
      </p>
    </div>
  );
}

export default function TasksByStageChart({ data }: Props) {
  const chartData = data.map((item, i) => ({
    name: item.stage,
    value: item.count,
    color: item.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  const total = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
          Tasks by Stage
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-surface-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-semibold">
          {total} total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
