'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ChevronLeft, AlertCircle, Phone } from 'lucide-react';
import { workOrdersAPI } from '@/lib/api';

function loadColor(open) {
  if (open <= 5) return { bg: 'bg-[#F0FDF4]', text: 'text-[#166534]', bar: 'bg-[#86EFAC]' };
  if (open <= 10) return { bg: 'bg-[#FFFBEB]', text: 'text-[#92400E]', bar: 'bg-[#FCD34D]' };
  return { bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]', bar: 'bg-[#FCA5A5]' };
}

function formatNextDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dateOnly = new Date(date); dateOnly.setHours(0, 0, 0, 0);
  if (dateOnly.getTime() === today.getTime()) return 'היום';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'מחר';
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export default function TechnicianQueueWidget() {
  const [data, setData] = useState(null);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    workOrdersAPI
      .getQueueByTechnician()
      .then((res) => {
        if (cancelled) return;
        setData(res.data || []);
        setUnassignedTotal(res.unassignedTotal || 0);
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'שגיאה'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Card className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-2 text-[var(--text-soft)] text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-[var(--text-strong)]">
          <Users className="w-4 h-4 text-[var(--brand)]" />
          תור טכנאים
        </h3>
        <Link
          href="/work-orders"
          className="text-[12px] text-[var(--text-soft)] hover:text-[var(--brand)] flex items-center gap-0.5"
        >
          לכל המשימות <ChevronLeft className="w-3 h-3" />
        </Link>
      </div>

      {unassignedTotal > 0 && (
        <div className="mb-3 px-3 py-2 rounded-md bg-[#FEF2F2] border border-[#FCA5A5]/40 text-[12px] text-[#991B1B] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          יש {unassignedTotal} משימות שלא משובצות לטכנאי
        </div>
      )}

      {(!data || data.length === 0) ? (
        <div className="text-center py-6 text-[var(--text-soft)] text-sm">
          אין טכנאים פעילים
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((row) => {
            const color = loadColor(row.openTotal);
            const maxLoad = 12; // visual ceiling for the bar
            const pct = Math.min(100, (row.openTotal / maxLoad) * 100);
            return (
              <div
                key={row.technician._id}
                className="flex items-center gap-3 p-2.5 rounded-md border border-[var(--border-soft)] hover:border-[var(--border-strong)] transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[13px] text-[var(--text-strong)] truncate">
                      {row.technician.name}
                    </span>
                    {row.technician.phone && (
                      <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-0.5 font-tabular">
                        <Phone className="w-2.5 h-2.5" />
                        {row.technician.phone}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                    <div
                      className={`h-full ${color.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-soft)]">
                    <span>הבאה: {formatNextDate(row.nextWorkOrder?.scheduledDate)}</span>
                    {row.nextWorkOrder?.branchName && (
                      <>
                        <span>·</span>
                        <span className="truncate">{row.nextWorkOrder.branchName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`text-center px-2 py-1 rounded-md ${color.bg}`}>
                    <div className={`text-[10px] ${color.text}`}>פתוחות</div>
                    <div className={`text-base font-bold ${color.text} font-tabular`}>
                      {row.openTotal}
                    </div>
                  </div>
                  <div className="text-center px-2 py-1 rounded-md bg-[var(--surface-muted)]">
                    <div className="text-[10px] text-[var(--text-soft)]">היום</div>
                    <div className="text-base font-bold text-[var(--text-strong)] font-tabular">
                      {row.todayCount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
