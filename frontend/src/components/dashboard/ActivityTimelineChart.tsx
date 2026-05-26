import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimelineEntry } from '../../features/dashboard/types/dashboard.types';

interface Props {
  data: TimelineEntry[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-float text-sm min-w-[160px]">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {formatDate(label)}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400 capitalize text-xs">
              {entry.name}
            </span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-xs">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ActivityTimelineChart({ data }: Props) {
  // Show every 5th date label to avoid crowding
  const tickFormatter = (_: string, index: number) =>
    index % 5 === 0 ? formatDate(data[index]?.date ?? '') : '';

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
          Activity Timeline (30 Days)
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={tickFormatter}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {value}
              </span>
            )}
          />

          <Area
            type="monotone"
            dataKey="tasksCreated"
            name="Created"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradCreated)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="tasksCompleted"
            name="Completed"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#gradCompleted)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="hoursLogged"
            name="Hours"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gradHours)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
