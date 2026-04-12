'use client';

import {
  DollarSign,
  Cpu,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const iconMap = {
  money: DollarSign,
  devices: Cpu,
  branches: MapPin,
  alerts: AlertTriangle
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon = 'devices',
  trend,
  color = 'primary',
  prefix = '',
  suffix = ''
}) {
  const Icon = iconMap[icon] || Cpu;

  const colorStyles = {
    primary: {
      background: 'linear-gradient(to bottom right, var(--color-primary-50), var(--color-primary-100))',
      borderColor: 'var(--color-primary-200)',
      iconBg: 'var(--color-primary)',
      valueColor: 'var(--color-primary-dark)'
    },
    green: {
      background: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
      borderColor: '#a7f3d0',
      iconBg: '#10b981',
      valueColor: '#047857'
    },
    blue: {
      background: 'linear-gradient(to bottom right, #eff6ff, #dbeafe)',
      borderColor: '#bfdbfe',
      iconBg: '#3b82f6',
      valueColor: '#1d4ed8'
    },
    amber: {
      background: 'linear-gradient(to bottom right, #fffbeb, #fef3c7)',
      borderColor: '#fde68a',
      iconBg: '#f59e0b',
      valueColor: '#b45309'
    },
    red: {
      background: 'linear-gradient(to bottom right, #fef2f2, #fee2e2)',
      borderColor: '#fecaca',
      iconBg: '#ef4444',
      valueColor: '#b91c1c'
    }
  };

  const styles = colorStyles[color] || colorStyles.primary;

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('he-IL');
    }
    return val;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
      style={{
        background: styles.background,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: styles.borderColor
      }}
    >
      {/* Background decoration */}
      <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/20 blur-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            {prefix && (
              <span
                className="text-xl font-bold"
                style={{ color: styles.valueColor }}
              >
                {prefix}
              </span>
            )}
            <p
              className="text-3xl font-bold"
              style={{ color: styles.valueColor }}
            >
              {formatValue(value)}
            </p>
            {suffix && (
              <span
                className="text-lg font-medium"
                style={{ color: styles.valueColor }}
              >
                {suffix}
              </span>
            )}
          </div>

          {(subtitle || trend !== undefined) && (
            <div className="flex items-center gap-2 mt-2">
              {trend !== undefined && (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  trend > 0
                    ? 'bg-green-100 text-green-700'
                    : trend < 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
              {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
            </div>
          )}
        </div>

        <div
          className="p-3 rounded-xl shadow-lg"
          style={{ backgroundColor: styles.iconBg }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
