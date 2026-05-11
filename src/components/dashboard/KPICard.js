'use client';

import {
  DollarSign, Cpu, MapPin, AlertTriangle, TrendingUp, TrendingDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const iconMap = {
  money: DollarSign,
  devices: Cpu,
  branches: MapPin,
  alerts: AlertTriangle
};

// Each color → soft tinted icon background + label color
const colorMap = {
  primary: { bg: 'bg-[var(--brand-50)]',     fg: 'text-[var(--brand-hover)]'  },
  green:   { bg: 'bg-[var(--status-green-bg)]', fg: 'text-[var(--status-green-text)]' },
  blue:    { bg: 'bg-[var(--status-blue-bg)]',  fg: 'text-[var(--status-blue-text)]'  },
  amber:   { bg: 'bg-[var(--status-amber-bg)]', fg: 'text-[var(--status-amber-text)]' },
  red:     { bg: 'bg-[var(--status-red-bg)]',   fg: 'text-[var(--status-red-text)]'   }
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
  const c = colorMap[color] || colorMap.primary;

  const formatValue = (val) =>
    typeof val === 'number' ? val.toLocaleString('he-IL') : val;

  return (
    <Card className="p-4 hover:border-[var(--border-strong)] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-[var(--text-soft)] mb-2">{title}</p>
          <div className="flex items-baseline gap-1 font-tabular">
            {prefix && (
              <span className="text-base font-semibold text-[var(--text-soft)]">{prefix}</span>
            )}
            <span className="text-[26px] font-bold text-[var(--text-strong)] leading-none tracking-tight">
              {formatValue(value)}
            </span>
            {suffix && (
              <span className="text-sm font-medium text-[var(--text-soft)]">{suffix}</span>
            )}
          </div>

          {(subtitle || trend !== undefined) && (
            <div className="flex items-center gap-2 mt-2.5">
              {trend !== undefined && (
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                  trend > 0
                    ? 'bg-[var(--status-green-bg)] text-[var(--status-green-text)]'
                    : trend < 0
                    ? 'bg-[var(--status-red-bg)] text-[var(--status-red-text)]'
                    : 'bg-[var(--surface-muted)] text-[var(--text-soft)]'
                }`}>
                  {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
              {subtitle && <span className="text-[12px] text-[var(--text-soft)]">{subtitle}</span>}
            </div>
          )}
        </div>

        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
          <Icon className={`w-4.5 h-4.5 ${c.fg}`} strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}
