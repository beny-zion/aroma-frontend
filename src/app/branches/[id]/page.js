'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Breadcrumb from '@/components/shared/Breadcrumb';
import StatusBadge from '@/components/StatusBadge';
import RefillProgressBar from '@/components/RefillProgressBar';
import {
  Building2, MapPin, Phone, User, Droplets, Eye,
  ArrowRight, Loader2, Calendar
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

export default function BranchDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: branch, error, isLoading } = useSWR(id ? `/branches/${id}` : null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (error || (!isLoading && !branch)) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="empty-state">
          <div className="empty-state-icon"><Building2 className="w-7 h-7" /></div>
          <p>{error?.message || 'הסניף לא נמצא'}</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            חזרה
          </button>
        </div>
      </div>
    );
  }

  const customerId = branch.customerId?._id;
  const customerName = branch.customerId?.name || 'לקוח';

  const breadcrumbItems = [
    { label: 'לקוחות', href: '/customers' },
    { label: customerName, href: `/customers/${customerId}` },
    { label: branch.branchName, href: `/branches/${branch._id}` },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* כותרת + חזרה */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/customers/${customerId}`)}
            className="action-btn action-btn-secondary"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {branch.branchName}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {customerName}
            </p>
          </div>
        </div>
        {branch.isActive ? (
          <span className="status-badge status-badge-green">פעיל</span>
        ) : (
          <span className="status-badge bg-gray-100 text-gray-600">לא פעיל</span>
        )}
      </div>

      {/* כרטיס פרטי סניף */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Building2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          פרטי סניף
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>עיר</span>
              <div className="font-medium">{branch.city || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>אזור</span>
              <div className="font-medium">{branch.region || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Building2 size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>כתובת</span>
              <div className="font-medium">{branch.address || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Droplets size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מחזור ביקור</span>
              <div className="font-medium">{branch.visitIntervalDays || 30} ימים</div>
            </div>
          </div>
          {branch.contactPerson && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
              <User size={16} style={{ color: 'var(--color-primary)' }} />
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>איש קשר</span>
                <div className="font-medium">{branch.contactPerson}</div>
              </div>
            </div>
          )}
          {branch.contactPhone && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
              <Phone size={16} style={{ color: 'var(--color-primary)' }} />
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>טלפון</span>
                <div className="font-medium">{branch.contactPhone}</div>
              </div>
            </div>
          )}
        </div>

        {branch.notes && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>הערות: </span>
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{branch.notes}</span>
          </div>
        )}
      </div>

      {/* מכשירים בסניף */}
      <div>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Droplets className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          מכשירים בסניף
          {branch.devices && (
            <span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
              ({branch.devices.length})
            </span>
          )}
        </h2>

        {branch.devices && branch.devices.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="table-container hidden md:block">
              <table>
                <thead>
                  <tr>
                    <th>סטטוס</th>
                    <th>סוג</th>
                    <th>מיקום</th>
                    <th>ריח</th>
                    <th>מילוי אחרון</th>
                    <th>ימים מאז מילוי</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {branch.devices.map(device => {
                    const daysSince = getDaysSince(device.lastRefillDate);
                    return (
                      <tr
                        key={device._id}
                        className="cursor-pointer hover:bg-[var(--color-sage-50)] transition-colors"
                        onClick={() => router.push(`/devices/${device._id}`)}
                      >
                        <td>
                          <StatusBadge status={device.refillStatus} showText={false} />
                        </td>
                        <td className="font-medium">{device.deviceType}</td>
                        <td>{device.locationInBranch || '-'}</td>
                        <td>{device.scentId?.name || '-'}</td>
                        <td>{formatDate(device.lastRefillDate)}</td>
                        <td>
                          {daysSince !== null ? (
                            <span className={`font-medium ${
                              daysSince > 45 ? 'text-[var(--color-status-red-text)]' :
                              daysSince > 30 ? 'text-[var(--color-status-amber-text)]' :
                              'text-[var(--color-status-green-text)]'
                            }`}>
                              {daysSince} ימים
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="action-btn action-btn-primary text-xs">
                              <Eye size={14} />
                              פרטים
                            </span>
                            <a
                              href={`/refill?device=${device._id}`}
                              className="action-btn action-btn-edit text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Droplets size={14} />
                              מילוי
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {branch.devices.map(device => {
                const daysSince = getDaysSince(device.lastRefillDate);
                return (
                  <div
                    key={device._id}
                    className="card cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/devices/${device._id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {device.deviceType}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {device.locationInBranch || '-'}
                        </div>
                      </div>
                      <StatusBadge status={device.refillStatus} />
                    </div>

                    <div className="text-sm space-y-1 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      <div>ריח: {device.scentId?.name || '-'}</div>
                      <div>מילוי אחרון: {formatDate(device.lastRefillDate)}</div>
                    </div>

                    {daysSince !== null && (
                      <RefillProgressBar daysSinceRefill={daysSince} />
                    )}

                    <div className="flex gap-2 mt-3 pt-2" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                      <span className="action-btn action-btn-primary text-xs flex-1 justify-center">
                        <Eye size={14} />
                        פרטי מכשיר
                      </span>
                      <a
                        href={`/refill?device=${device._id}`}
                        className="action-btn action-btn-edit text-xs flex-1 justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Droplets size={14} />
                        מילוי
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Droplets className="w-7 h-7" /></div>
            <p>אין מכשירים בסניף זה</p>
          </div>
        )}
      </div>
    </div>
  );
}
