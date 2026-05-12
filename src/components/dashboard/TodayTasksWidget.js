'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, ChevronLeft, User, AlertCircle } from 'lucide-react';
import { workOrdersAPI } from '@/lib/api';

export default function TodayTasksWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const todayISO = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    workOrdersAPI
      .getAll({
        dateFrom: todayISO,
        dateTo: todayISO,
        status: 'pending,assigned,in_progress,completed',
        limit: 100,
      })
      .then((res) => { if (!cancelled) setData(res.data || []); })
      .catch((err) => { if (!cancelled) setError(err.message || 'שגיאה'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [todayISO]);

  const stats = useMemo(() => {
    if (!data) return null;
    const groups = new Map();
    let total = 0, completed = 0, inProgress = 0, pending = 0, unassignedCount = 0;

    for (const wo of data) {
      total++;
      if (wo.status === 'completed') completed++;
      else if (wo.status === 'in_progress') inProgress++;
      else pending++;

      const techId = wo.assignedTo?._id || 'unassigned';
      const techName = wo.assignedTo?.name || 'לא משובץ';
      if (techId === 'unassigned') unassignedCount++;
      if (!groups.has(techId)) {
        groups.set(techId, { techId, techName, total: 0, completed: 0, inProgress: 0, pending: 0 });
      }
      const g = groups.get(techId);
      g.total++;
      if (wo.status === 'completed') g.completed++;
      else if (wo.status === 'in_progress') g.inProgress++;
      else g.pending++;
    }

    const techs = Array.from(groups.values()).sort((a, b) => {
      if (a.techId === 'unassigned') return 1;
      if (b.techId === 'unassigned') return -1;
      return b.total - a.total;
    });

    return {
      total, completed, inProgress, pending, unassignedCount,
      techCount: techs.filter(t => t.techId !== 'unassigned').length,
      percentDone: total > 0 ? Math.round((completed / total) * 100) : 0,
      techs,
    };
  }, [data]);

  if (loading) {
    return (
      <Card className="p-4 md:p-5 space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 md:p-5">
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-strong)]">אין משימות להיום</p>
              <p className="text-xs text-[var(--text-soft)]">תכנן מ"לוח שבועי"</p>
            </div>
          </div>
          <Link href="/schedule">
            <Button variant="outline" size="sm">
              <CalendarDays className="h-3.5 w-3.5" />
              לוח שבועי
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Top KPI strip */}
      <div className="grid grid-cols-3 divide-x divide-x-reverse border-b">
        <Stat label="סה״כ משימות" value={stats.total} />
        <Stat
          label="הושלמו"
          value={`${stats.completed}/${stats.total}`}
          accent={stats.percentDone === 100 ? 'green' : 'default'}
          sub={`${stats.percentDone}%`}
        />
        <Stat label="טכנאים פעילים" value={stats.techCount} />
      </div>

      {/* Overall progress bar */}
      <div className="px-4 md:px-5 pt-3 pb-1">
        <ProgressBar
          completed={stats.completed}
          inProgress={stats.inProgress}
          pending={stats.pending}
          total={stats.total}
        />
      </div>

      {/* Per-technician rows */}
      <div className="divide-y">
        {stats.techs.map((t) => (
          <TechRow key={t.techId} tech={t} todayISO={todayISO} />
        ))}
      </div>

      {/* Footer link */}
      <div className="flex items-center justify-between px-4 md:px-5 py-2.5 border-t bg-muted/30">
        {stats.unassignedCount > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            {stats.unassignedCount} משימות לא משובצות לטכנאי
          </div>
        ) : <span />}
        <Link href="/schedule" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
          לוח שבועי
          <ChevronLeft className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}

function Stat({ label, value, sub, accent }) {
  const valueColor =
    accent === 'green' ? 'text-emerald-600' : 'text-[var(--text-strong)]';
  return (
    <div className="px-4 md:px-5 py-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-[var(--text-soft)] font-medium">{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-soft)] mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ completed, inProgress, pending, total }) {
  if (total === 0) return null;
  const pctDone = (completed / total) * 100;
  const pctActive = (inProgress / total) * 100;
  const pctPending = (pending / total) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 text-[11px] text-[var(--text-soft)]">
        <LegendDot color="bg-emerald-500" label={`${completed} הושלמו`} />
        <LegendDot color="bg-amber-500" label={`${inProgress} בביצוע`} />
        <LegendDot color="bg-gray-300" label={`${pending} ממתינות`} />
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden flex">
        {pctDone > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pctDone}%` }} />}
        {pctActive > 0 && <div className="h-full bg-amber-500" style={{ width: `${pctActive}%` }} />}
        {pctPending > 0 && <div className="h-full bg-gray-300" style={{ width: `${pctPending}%` }} />}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function TechRow({ tech, todayISO }) {
  const pctDone = tech.total > 0 ? (tech.completed / tech.total) * 100 : 0;
  const isUnassigned = tech.techId === 'unassigned';
  const href = isUnassigned
    ? `/work-orders?dateFrom=${todayISO}&dateTo=${todayISO}`
    : `/work-orders?assignedTo=${tech.techId}&dateFrom=${todayISO}&dateTo=${todayISO}`;

  return (
    <Link href={href} className="flex items-center gap-3 px-4 md:px-5 py-2.5 hover:bg-accent transition-colors">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
        isUnassigned ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
      }`}>
        <User className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-sm font-medium truncate ${
            isUnassigned ? 'text-amber-700' : 'text-[var(--text-strong)]'
          }`}>{tech.techName}</span>
          <span className="text-xs text-[var(--text-soft)] shrink-0">
            {tech.completed}/{tech.total}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden flex">
          {tech.completed > 0 && (
            <div className="h-full bg-emerald-500" style={{ width: `${pctDone}%` }} />
          )}
          {tech.inProgress > 0 && (
            <div className="h-full bg-amber-500" style={{ width: `${(tech.inProgress / tech.total) * 100}%` }} />
          )}
        </div>
      </div>

      <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
