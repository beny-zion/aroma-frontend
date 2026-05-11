'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Calendar, MapPin, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

const HEBREW_DAY_LETTER = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const HEBREW_MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

const statusLabels = {
  pending: 'ממתין', assigned: 'שובץ', in_progress: 'בביצוע',
  completed: 'הושלם', cancelled: 'בוטל'
};
const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};
const priorityBorder = {
  low: 'border-gray-200',
  medium: 'border-blue-200',
  high: 'border-amber-300',
  urgent: 'border-red-400'
};

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
function fmtMonthYear(d) {
  return `${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function TechnicianCalendarPage() {
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [windowStart, setWindowStart] = useState(addDays(today, -3)); // show 14 days starting 3 days back
  const stripRef = useRef(null);

  const { data: tasksData, isLoading } = useSWR('/work-orders/my');
  const tasks = tasksData?.data || [];

  // Group task counts per date
  const countsByDate = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const key = startOfDay(new Date(t.scheduledDate)).getTime();
      const entry = map.get(key) || { total: 0, done: 0 };
      entry.total++;
      if (t.status === 'completed') entry.done++;
      map.set(key, entry);
    }
    return map;
  }, [tasks]);

  // Tasks for selected day
  const dayTasks = useMemo(() => {
    return tasks
      .filter(t => sameDay(new Date(t.scheduledDate), selectedDate))
      .sort((a, b) => {
        const order = { in_progress: 0, assigned: 1, pending: 2, completed: 3, cancelled: 4 };
        return (order[a.status] ?? 5) - (order[b.status] ?? 5);
      });
  }, [tasks, selectedDate]);

  // 14 days window
  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => addDays(windowStart, i));
  }, [windowStart]);

  // Auto-scroll selected day into view when it changes
  useEffect(() => {
    if (!stripRef.current) return;
    const el = stripRef.current.querySelector(`[data-date="${selectedDate.toDateString()}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate]);

  function shiftWindow(deltaDays) {
    setWindowStart(addDays(windowStart, deltaDays));
  }

  function jumpToToday() {
    setSelectedDate(today);
    setWindowStart(addDays(today, -3));
  }

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">טוען יומן...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            יומן עבודה
          </h1>
          <p className="text-sm text-muted-foreground">{fmtMonthYear(selectedDate)}</p>
        </div>
        {!sameDay(selectedDate, today) && (
          <button
            onClick={jumpToToday}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary/10 text-primary"
          >
            היום
          </button>
        )}
      </header>

      {/* Week strip — horizontal scrollable, RTL */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => shiftWindow(-7)}
          className="shrink-0 w-7 h-12 flex items-center justify-center rounded-md hover:bg-muted"
          aria-label="שבוע קודם"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={stripRef}
          className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {days.map((d) => {
            const isSelected = sameDay(d, selectedDate);
            const isToday = sameDay(d, today);
            const counts = countsByDate.get(d.getTime());
            const isWeekend = d.getDay() === 6; // Saturday
            return (
              <button
                key={d.toDateString()}
                data-date={d.toDateString()}
                onClick={() => setSelectedDate(d)}
                className={`shrink-0 w-12 py-2 rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : isToday
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : isWeekend
                    ? 'bg-muted/30 text-muted-foreground'
                    : 'bg-card border hover:bg-muted/50'
                }`}
              >
                <span className="text-[10px] font-medium opacity-70">
                  {HEBREW_DAY_LETTER[d.getDay()]}
                </span>
                <span className="text-base font-bold leading-none">{d.getDate()}</span>
                {counts && counts.total > 0 ? (
                  <span className={`text-[10px] font-medium px-1 rounded ${
                    isSelected ? 'bg-white/25' : counts.done === counts.total ? 'bg-green-500/20 text-green-700' : 'bg-amber-500/20 text-amber-700'
                  }`}>
                    {counts.done}/{counts.total}
                  </span>
                ) : (
                  <span className="text-[10px] opacity-40">·</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => shiftWindow(7)}
          className="shrink-0 w-7 h-12 flex items-center justify-center rounded-md hover:bg-muted"
          aria-label="שבוע הבא"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Selected day tasks */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground mb-2 px-1">
          {sameDay(selectedDate, today)
            ? 'משימות היום'
            : sameDay(selectedDate, addDays(today, 1))
            ? 'משימות מחר'
            : `משימות ${selectedDate.toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit' })}`}
        </h2>

        {dayTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">אין משימות ביום זה</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayTasks.map((task) => (
              <Link
                key={task._id}
                href={`/technician/tasks?focus=${task._id}`}
                className={`block bg-card rounded-xl border-r-4 ${priorityBorder[task.priority]} border p-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm truncate">{task.branchId?.branchName || '-'}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${statusColors[task.status]}`}>
                        {statusLabels[task.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.branchId?.customerId?.name || ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {task.branchId?.city || ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.devices?.length || 0} מכשירים
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
