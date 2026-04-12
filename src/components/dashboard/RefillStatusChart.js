'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

const COLORS = {
  green: '#22c55e',
  yellow: '#f59e0b',
  red: '#ef4444',
  unknown: '#9ca3af'
};

const STATUS_LABELS = {
  green: 'תקין (עד 30 יום)',
  yellow: 'דורש תכנון (30-45 יום)',
  red: 'קריטי (מעל 45 יום)',
  unknown: 'לא ידוע'
};

const STATUS_ICONS = {
  green: CheckCircle,
  yellow: AlertTriangle,
  red: XCircle,
  unknown: HelpCircle
};

export default function RefillStatusChart({ data }) {
  if (!data) return null;

  const chartData = [
    { name: STATUS_LABELS.green, value: data.green, color: COLORS.green, key: 'green' },
    { name: STATUS_LABELS.yellow, value: data.yellow, color: COLORS.yellow, key: 'yellow' },
    { name: STATUS_LABELS.red, value: data.red, color: COLORS.red, key: 'red' },
  ].filter(item => item.value > 0);

  if (data.unknown > 0) {
    chartData.push({ name: STATUS_LABELS.unknown, value: data.unknown, color: COLORS.unknown, key: 'unknown' });
  }

  const total = data.total || 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-800">{item.name}</p>
          <p className="text-gray-600">
            <span className="font-bold text-lg" style={{ color: item.color }}>{item.value}</span>
            {' '}מכשירים ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => (
    <div className="flex flex-col gap-2 mt-4">
      {chartData.map((entry) => {
        const Icon = STATUS_ICONS[entry.key];
        const percentage = data.percentages?.[entry.key] || 0;
        return (
          <div key={entry.key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Icon className="w-5 h-5" style={{ color: entry.color }} />
            <div className="flex-1">
              <span className="text-sm text-gray-700">{entry.name}</span>
            </div>
            <div className="text-left">
              <span className="font-bold text-gray-800">{entry.value}</span>
              <span className="text-gray-400 text-sm mr-1">({percentage}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">סטטוס מילויים</h3>
        <span className="text-sm text-gray-500">{total} מכשירים</span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="w-full lg:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2">
          {renderCustomLegend()}
        </div>
      </div>

      {/* Critical Alert */}
      {data.red > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 animate-pulse" />
          <p className="text-sm text-red-700">
            <span className="font-bold">{data.red} מכשירים</span> דורשים מילוי דחוף!
          </p>
        </div>
      )}
    </div>
  );
}
