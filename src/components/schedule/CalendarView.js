'use client';

import { useEffect, useState } from 'react';
import { scheduleAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, ChevronLeft, ChevronRight, MapPin, User as UserIcon,
  AlertCircle, Briefcase
} from 'lucide-react';

const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const STATUS_LABEL = {
  pending: 'ממתין',
  assigned: 'משובץ',
  in_progress: 'בעבודה',
  completed: 'הושלם',
  cancelled: 'בוטל'
};
const STATUS_CLASS = {
  pending: 'bg-[var(--surface-muted)] text-[var(--text-soft)]',
  assigned: 'bg-[#E1EBE5] text-[#4A6B59]',
  in_progress: 'bg-[#FFFBEB] text-[#92400E]',
  completed: 'bg-[#F0FDF4] text-[#166534]',
  cancelled: 'bg-[#FEF2F2] text-[#991B1B]'
};

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(isoDate, days) {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toLocalDateString(dt);
}

export default function CalendarView() {
  const today = toLocalDateString(new Date());
  const [from, setFrom] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const to = addDays(from, 13); // 14-day window

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    scheduleAPI
      .getCalendar({ from, to })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message || 'שגיאה'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-[var(--text-soft)] text-sm">
          <CalendarDays className="w-4 h-4 text-[var(--brand)]" />
          <span>14 ימים: {from} → {to}</span>
        </div>
        <div className="flex items-center gap-1 bg-card border rounded-xl p-1">
          <button
            onClick={() => setFrom(addDays(from, -14))}
            className="p-1.5 rounded-md hover:bg-[var(--surface-muted)]"
            aria-label="14 ימים אחורה"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFrom(today)}
            className="px-2 py-1 text-[12px] rounded-md hover:bg-[var(--surface-muted)]"
          >
            היום
          </button>
          <button
            onClick={() => setFrom(addDays(from, 14))}
            className="p-1.5 rounded-md hover:bg-[var(--surface-muted)]"
            aria-label="14 ימים קדימה"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      )}

      {error && (
        <div className="card text-center py-8 text-[var(--text-soft)]">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" /> {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.days.map((day) => {
            const isHolidayBlocked = day.holiday?.isWorkBlocked;
            const utilizationPct = Math.min(100, (day.capacity.used / day.capacity.max) * 100);
            return (
              <div
                key={day.date}
                className={`card ${isHolidayBlocked ? 'bg-[var(--surface-muted)] opacity-70' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-[13px] text-[var(--text-strong)]">
                      {DAY_NAMES_HE[day.dayOfWeek]}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-tabular">
                      {day.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[var(--brand)] font-tabular">
                      {day.capacity.used}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      מתוך {day.capacity.max}
                    </div>
                  </div>
                </div>

                {day.holiday && (
                  <div className="mb-2 px-2 py-1 rounded-md bg-[#FFFBEB] text-[11px] text-[#92400E] border border-[#FCD34D]/40">
                    {day.holiday.name}
                  </div>
                )}

                <div className="h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden mb-2">
                  <div
                    className="h-full bg-[var(--brand)] transition-all"
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>

                {day.techniciansAssigned.length > 0 ? (
                  <div className="space-y-1.5 mb-2">
                    {day.techniciansAssigned.map((t) => (
                      <div key={t._id} className="flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-1 text-[var(--text-default)]">
                          <UserIcon className="w-3 h-3 text-[var(--text-muted)]" />
                          {t.name}
                        </span>
                        <span className="text-[var(--text-soft)] font-tabular">
                          {t.workOrderCount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : day.workOrders.length === 0 ? (
                  <div className="text-[11.5px] text-[var(--text-muted)] text-center py-3">
                    אין שיבוצים
                  </div>
                ) : (
                  <div className="text-[11.5px] text-[#92400E] mb-2">
                    משימות ללא טכנאי משובץ
                  </div>
                )}

                {day.workOrders.length > 0 && (
                  <details className="text-[11.5px]">
                    <summary className="cursor-pointer text-[var(--text-soft)] hover:text-[var(--brand)] py-1">
                      {day.workOrders.length} משימות
                    </summary>
                    <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                      {day.workOrders.map((wo) => (
                        <div
                          key={wo._id}
                          className="p-1.5 rounded-md bg-[var(--surface-muted)] flex items-center gap-1.5"
                        >
                          <Briefcase className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[var(--text-default)]">
                              {wo.branchName}
                            </div>
                            {wo.city && (
                              <div className="text-[10px] text-[var(--text-muted)] truncate">
                                {wo.city}
                              </div>
                            )}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_CLASS[wo.status] || ''}`}>
                            {STATUS_LABEL[wo.status] || wo.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
