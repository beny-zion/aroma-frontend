'use client';

import useSWR from 'swr';
import Link from 'next/link';
import {
  ClipboardList, Calendar, User, CheckCircle, Clock, AlertCircle, ChevronLeft
} from 'lucide-react';

const STATUS_LABELS = {
  pending: 'ממתין',
  assigned: 'שובץ',
  in_progress: 'בביצוע',
  completed: 'הושלם',
  cancelled: 'בוטל'
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatRelative(d) {
  if (!d) return '';
  const target = new Date(d);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((target - now) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff === -1) return 'אתמול';
  if (diff > 0) return `בעוד ${diff} ימים`;
  return `לפני ${-diff} ימים`;
}

/**
 * VisitsPanel — shows upcoming + recent work orders related to a branch / customer / device.
 * Pass exactly one of: branchId | customerId | deviceId.
 */
export default function VisitsPanel({ branchId, customerId, deviceId, title = 'ביקורים' }) {
  const params = new URLSearchParams({ limit: 20 });
  if (branchId) params.set('branchId', branchId);
  if (customerId) params.set('customerId', customerId);
  if (deviceId) params.set('deviceId', deviceId);

  const swrKey = (branchId || customerId || deviceId) ? `/work-orders?${params.toString()}` : null;
  const { data, isLoading } = useSWR(swrKey);
  const workOrders = data?.data || [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = workOrders.filter(wo => ['pending', 'assigned', 'in_progress'].includes(wo.status))
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  const recent = workOrders.filter(wo => ['completed', 'cancelled'].includes(wo.status))
    .sort((a, b) => new Date(b.completedDate || b.scheduledDate) - new Date(a.completedDate || a.scheduledDate))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="card">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
          <ClipboardList className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          {title}
        </h2>
        <p className="text-sm text-gray-500">טוען...</p>
      </div>
    );
  }

  if (workOrders.length === 0) {
    return (
      <div className="card">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
          <ClipboardList className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          {title}
        </h2>
        <div className="empty-state py-6">
          <p className="text-gray-500 text-sm">אין הזמנות עבודה עדיין</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2 text-gray-800">
          <ClipboardList className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          {title}
        </h2>
        <Link
          href={branchId ? `/work-orders?branchId=${branchId}` : '/work-orders'}
          className="text-sm flex items-center gap-1 hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          להזמנות עבודה
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            ביקור הבא ({upcoming.length})
          </h3>
          <div className="space-y-2">
            {upcoming.slice(0, 3).map(wo => (
              <Link
                key={wo._id}
                href={`/work-orders?id=${wo._id}`}
                className="block p-3 border rounded-xl hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'var(--color-border-light)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[wo.status]}`}>
                        {STATUS_LABELS[wo.status]}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{formatDate(wo.scheduledDate)}</span>
                      <span className="text-xs text-gray-500">{formatRelative(wo.scheduledDate)}</span>
                    </div>
                    {customerId && wo.branchId?.branchName && (
                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" />
                        {wo.branchId.branchName}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 mt-1 flex items-center gap-3 flex-wrap">
                      {wo.assignedTo?.name ? (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {wo.assignedTo.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="w-3 h-3" />
                          לא שובץ טכנאי
                        </span>
                      )}
                      <span className="text-gray-400">·</span>
                      <span>{wo.devices?.length || 0} מכשירים</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {upcoming.length > 3 && (
              <p className="text-xs text-gray-500 text-center pt-1">+ עוד {upcoming.length - 3}</p>
            )}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            ביקורים אחרונים
          </h3>
          <div className="space-y-1.5">
            {recent.map(wo => (
              <div
                key={wo._id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg)' }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {wo.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span className="text-gray-700">{formatDate(wo.completedDate || wo.scheduledDate)}</span>
                  {wo.assignedTo?.name && (
                    <span className="text-xs text-gray-500 truncate">· {wo.assignedTo.name}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{wo.devices?.length || 0} מכשירים</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
