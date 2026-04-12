'use client';

import { MapPin, Building2, TrendingUp } from 'lucide-react';

const BAR_COLORS = [
  { bar: '#4A6B59', bg: 'rgba(74, 107, 89, 0.12)' },
  { bar: '#3B82F6', bg: 'rgba(59, 130, 246, 0.10)' },
  { bar: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.10)' },
  { bar: '#F59E0B', bg: 'rgba(245, 158, 11, 0.10)' },
  { bar: '#EC4899', bg: 'rgba(236, 72, 153, 0.10)' },
  { bar: '#6B8E7B', bg: 'rgba(107, 142, 123, 0.10)' },
];

export default function GeoDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">התפלגות גיאוגרפית</h3>
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <MapPin className="w-10 h-10 mb-2 opacity-40" />
          <span>אין נתונים גיאוגרפיים</span>
        </div>
      </div>
    );
  }

  const totalDevices = data.reduce((sum, item) => sum + item.deviceCount, 0);
  const maxDevices = Math.max(...data.map(item => item.deviceCount));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--color-primary-100)' }}>
            <MapPin className="w-5 h-5" style={{ color: 'var(--color-primary-dark)' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">התפלגות גיאוגרפית</h3>
            <p className="text-sm text-gray-500">{data.length} אזורים פעילים</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-dark)' }}>
          <TrendingUp className="w-3.5 h-3.5" />
          {totalDevices} מכשירים
        </div>
      </div>

      {/* Visual Bars */}
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = totalDevices > 0 ? Math.round((item.deviceCount / totalDevices) * 100) : 0;
          const barWidth = maxDevices > 0 ? Math.max((item.deviceCount / maxDevices) * 100, 8) : 0;
          const color = BAR_COLORS[index % BAR_COLORS.length];

          return (
            <div
              key={index}
              className="group rounded-xl p-3 transition-all hover:shadow-sm cursor-default"
              style={{ backgroundColor: color.bg }}
            >
              {/* Top row: city name + count */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color.bar }}
                  />
                  <span className="font-semibold text-gray-800 text-sm">{item.city}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {item.branchCount} סניפים
                  </span>
                  <span className="font-bold text-sm" style={{ color: color.bar }}>
                    {item.deviceCount}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: color.bar,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500 w-10 text-left">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {data.length > 3 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>סה"כ {data.reduce((sum, item) => sum + item.branchCount, 0)} סניפים</span>
          <span>{totalDevices} מכשירים ב-{data.length} אזורים</span>
        </div>
      )}
    </div>
  );
}
