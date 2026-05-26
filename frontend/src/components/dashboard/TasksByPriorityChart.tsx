import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TasksByPriorityItem } from '../../features/dashboard/types/dashboard.types';

interface Props {
  data: TasksByPriorityItem[];
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

interface TooltipPayloadEntry {
  value: number;
  payload: { name: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-float text-sm">
      <p className="font-semibold text-gray-800 dark:text-white capitalize">
        {payload[0].payload.name.toLowerCase()}
      </p>
      <p className="text-primary-600 dark:text-primary-400 font-bold">
        {payload[0].value} tasks
      </p>
    </div>
  );
}

export default function TasksByPriorityChart({ data }: Props) {
  const chartData = data.map((item) => ({
    name: item.priority,
    count: item.count,
    color: PRIORITY_COLORS[item.priority] ?? '#6b7280',
  }));

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
          Tasks by Priority
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) =>
              v.charAt(0) + v.slice(1).toLowerCase()
            }
            width={54}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
