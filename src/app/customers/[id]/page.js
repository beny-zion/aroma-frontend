'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Breadcrumb from '@/components/shared/Breadcrumb';
import {
  Users, Phone, Mail, Building2, CreditCard, MapPin,
  ArrowRight, Edit3, Eye, Loader2
} from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: customer, error, isLoading } = useSWR(id ? `/customers/${id}` : null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (error || (!isLoading && !customer)) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="empty-state">
          <div className="empty-state-icon"><Users className="w-7 h-7" /></div>
          <p>{error?.message || 'הלקוח לא נמצא'}</p>
          <button onClick={() => router.push('/customers')} className="btn-primary mt-4">
            חזרה לרשימת לקוחות
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'לקוחות', href: '/customers' },
    { label: customer.name, href: `/customers/${customer._id}` },
  ];

  const statusConfig = {
    active: { label: 'פעיל', className: 'status-badge-green' },
    pending: { label: 'בתהליך', className: 'status-badge-yellow' },
    inactive: { label: 'לא פעיל', className: 'bg-gray-100 text-gray-600' },
  };

  const status = statusConfig[customer.status] || statusConfig.inactive;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* כותרת + חזרה */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/customers')}
            className="action-btn action-btn-secondary"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {customer.name}
            </h1>
            <span className={`status-badge ${status.className} mt-1 inline-block`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* כרטיס פרטי לקוח */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <CreditCard className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            פרטי לקוח
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>טלפון:</span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {customer.billingDetails?.phone || '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>אימייל:</span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {customer.billingDetails?.email || '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>ע.מורשה:</span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {customer.billingDetails?.taxId || '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>כתובת:</span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {customer.billingDetails?.address || '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>מחיר חודשי:</span>
            <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
              {(customer.monthlyPrice || 0).toLocaleString()} &#8362;
            </span>
          </div>
        </div>

        {customer.notes && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>הערות: </span>
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{customer.notes}</span>
          </div>
        )}
      </div>

      {/* סניפים */}
      <div>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <MapPin className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          סניפים
          {customer.branches && (
            <span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
              ({customer.branches.length})
            </span>
          )}
        </h2>

        {customer.branches && customer.branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.branches.map((branch) => (
              <div
                key={branch._id}
                className="card hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden"
                onClick={() => router.push(`/branches/${branch._id}`)}
              >
                <div className="absolute -left-3 -bottom-3 opacity-[0.04]">
                  <Building2 size={80} />
                </div>
                <div className="relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {branch.branchName}
                    </h3>
                    {branch.isActive ? (
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--color-primary)' }} />
                    ) : (
                      <span className="w-2.5 h-2.5 bg-gray-300 rounded-full shrink-0" />
                    )}
                  </div>

                  <div className="text-sm mb-3 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {branch.city && <div>{branch.city}</div>}
                    {branch.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                        {branch.address}
                      </div>
                    )}
                    {branch.contactPerson && (
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {branch.contactPerson} {branch.contactPhone && `| ${branch.contactPhone}`}
                      </div>
                    )}
                  </div>

                  <div
                    className="flex justify-between items-center text-sm pt-2"
                    style={{ borderTop: '1px solid var(--color-border-light)' }}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      מחזור: {branch.visitIntervalDays || 30} יום
                    </span>
                    <span className="action-btn action-btn-primary text-xs">
                      <Eye size={14} />
                      פרטים
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Building2 className="w-7 h-7" /></div>
            <p>אין סניפים עדיין ללקוח זה</p>
          </div>
        )}
      </div>
    </div>
  );
}
