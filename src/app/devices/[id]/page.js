'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Breadcrumb from '@/components/shared/Breadcrumb';
import StatusBadge from '@/components/StatusBadge';
import RefillProgressBar from '@/components/RefillProgressBar';
import {
  Droplets, MapPin, Calendar, Wrench, PlusCircle, MinusCircle,
  RefreshCw, ArrowRight, Loader2, Clock, User, FileText
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('he-IL');
}

function getDaysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const serviceTypeConfig = {
  refill: {
    label: 'מילוי',
    color: 'var(--color-status-green-text)',
    bg: 'var(--color-status-green-bg)',
    borderColor: 'var(--color-status-green)',
    Icon: Droplets,
  },
  repair: {
    label: 'תיקון',
    color: 'var(--color-status-amber-text)',
    bg: 'var(--color-status-amber-bg)',
    borderColor: 'var(--color-status-amber)',
    Icon: Wrench,
  },
  replacement: {
    label: 'החלפה',
    color: '#2563EB',
    bg: '#EFF6FF',
    borderColor: '#93C5FD',
    Icon: RefreshCw,
  },
  installation: {
    label: 'התקנה',
    color: 'var(--color-primary-dark)',
    bg: 'var(--color-primary-50)',
    borderColor: 'var(--color-primary-light)',
    Icon: PlusCircle,
  },
  removal: {
    label: 'הסרה',
    color: 'var(--color-status-red-text)',
    bg: 'var(--color-status-red-bg)',
    borderColor: 'var(--color-status-red)',
    Icon: MinusCircle,
  },
};

export default function DeviceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: device, error: deviceError, isLoading: deviceLoading } = useSWR(id ? `/devices/${id}` : null);
  const { data: logsData, error: logsError, isLoading: logsLoading } = useSWR(id ? `/service-logs/device/${id}/history` : null);

  const serviceLogs = Array.isArray(logsData) ? logsData : [];
  const isLoading = deviceLoading || logsLoading;
  const error = deviceError || logsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (error || (!isLoading && !device)) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="empty-state">
          <div className="empty-state-icon"><Droplets className="w-7 h-7" /></div>
          <p>{error?.message || 'המכשיר לא נמצא'}</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            חזרה
          </button>
        </div>
      </div>
    );
  }

  const branchId = device.branchId?._id;
  const branchName = device.branchId?.branchName || 'סניף';
  const customerId = device.branchId?.customerId?._id;
  const customerName = device.branchId?.customerId?.name || 'לקוח';
  const daysSince = getDaysSince(device.lastRefillDate);
  const deviceLabel = `${device.deviceType}${device.locationInBranch ? ` - ${device.locationInBranch}` : ''}`;

  const breadcrumbItems = [
    { label: 'לקוחות', href: '/customers' },
    { label: customerName, href: `/customers/${customerId}` },
    { label: branchName, href: `/branches/${branchId}` },
    { label: deviceLabel, href: `/devices/${device._id}` },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* כותרת + חזרה */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/branches/${branchId}`)}
            className="action-btn action-btn-secondary"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {deviceLabel}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {branchName} | {customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={device.refillStatus} />
          {device.isActive === false && (
            <span className="status-badge bg-gray-100 text-gray-600">לא פעיל</span>
          )}
        </div>
      </div>

      {/* כרטיס פרטי מכשיר */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Droplets className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            פרטי מכשיר
          </h2>
          <a
            href={`/refill?device=${device._id}`}
            className="action-btn action-btn-primary"
          >
            <Droplets size={14} />
            ביצוע מילוי
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Droplets size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>סוג מכשיר</span>
              <div className="font-medium">{device.deviceType}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מיקום בסניף</span>
              <div className="font-medium">{device.locationInBranch || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Droplets size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>ריח נוכחי</span>
              <div className="font-medium">{device.scentId?.name || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מילוי אחרון</span>
              <div className="font-medium">{formatDate(device.lastRefillDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מילוי הבא</span>
              <div className="font-medium">{formatDate(device.nextScheduledRefill)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Clock size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מרווח מילוי</span>
              <div className="font-medium">{device.refillIntervalDays || 30} ימים | {device.mlPerRefill || 100} מ"ל</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {daysSince !== null && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <RefillProgressBar daysSinceRefill={daysSince} />
          </div>
        )}

        {device.notes && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>הערות: </span>
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{device.notes}</span>
          </div>
        )}
      </div>

      {/* היסטוריית שירות */}
      <div>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          היסטוריית שירות
          <span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
            ({serviceLogs.length})
          </span>
        </h2>

        {serviceLogs.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute top-0 bottom-0 hidden md:block"
              style={{
                right: '19px',
                width: '2px',
                background: 'var(--color-border)',
              }}
            />

            <div className="space-y-3">
              {serviceLogs.map((log, index) => {
                const typeConfig = serviceTypeConfig[log.serviceType] || serviceTypeConfig.refill;
                const { Icon } = typeConfig;

                return (
                  <div key={log._id || index} className="flex gap-3 md:gap-4 relative">
                    {/* Timeline dot - desktop */}
                    <div className="hidden md:flex shrink-0 w-10 items-start justify-center pt-4 z-10">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: typeConfig.bg, border: `2px solid ${typeConfig.borderColor}` }}
                      >
                        <Icon size={14} style={{ color: typeConfig.color }} />
                      </div>
                    </div>

                    {/* Card */}
                    <div className="card flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {/* Mobile icon */}
                          <div
                            className="md:hidden w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: typeConfig.bg, border: `2px solid ${typeConfig.borderColor}` }}
                          >
                            <Icon size={12} style={{ color: typeConfig.color }} />
                          </div>
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ background: typeConfig.bg, color: typeConfig.color }}
                          >
                            {typeConfig.label}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {formatDate(log.date)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {log.technicianName && (
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            <span>טכנאי: <span style={{ color: 'var(--color-text-primary)' }}>{log.technicianName}</span></span>
                          </div>
                        )}
                        {log.mlFilled > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Droplets size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            <span>כמות: <span style={{ color: 'var(--color-text-primary)' }}>{log.mlFilled} מ"ל</span></span>
                          </div>
                        )}
                        {log.scentId?.name && (
                          <div className="flex items-center gap-1.5">
                            <Droplets size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            <span>ריח: <span style={{ color: 'var(--color-text-primary)' }}>{log.scentId.name}</span></span>
                          </div>
                        )}
                      </div>

                      {(log.technicianNotes || log.issuesFound) && (
                        <div className="mt-2 pt-2 text-sm" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                          {log.issuesFound && (
                            <div style={{ color: 'var(--color-status-red-text)' }}>
                              תקלות: {log.issuesFound}
                            </div>
                          )}
                          {log.technicianNotes && (
                            <div style={{ color: 'var(--color-text-secondary)' }}>
                              הערות: {log.technicianNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText className="w-7 h-7" /></div>
            <p>אין היסטוריית שירות למכשיר זה</p>
          </div>
        )}
      </div>
    </div>
  );
}
