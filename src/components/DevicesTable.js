'use client';

import { useState, useMemo } from 'react';
import StatusBadge from './StatusBadge';

// רשימת אזורים לסינון
const AREAS = [
  { value: '', label: 'כל האזורים' },
  { value: 'ירושלים', label: 'ירושלים' },
  { value: 'בני ברק', label: 'בני ברק' },
  { value: 'תל אביב', label: 'תל אביב' },
  { value: 'חיפה', label: 'חיפה' },
  { value: 'באר שבע', label: 'באר שבע' },
  { value: 'פתח תקווה', label: 'פתח תקווה' },
  { value: 'אשדוד', label: 'אשדוד' },
];

/**
 * Devices Table Component
 * טבלת מכשירים עם צבעי סטטוס וסינון לפי אזור
 */
export default function DevicesTable({ devices, onRowClick }) {
  const [areaFilter, setAreaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // סינון המכשירים
  const filteredDevices = useMemo(() => {
    if (!devices) return [];

    return devices.filter(device => {
      // סינון לפי אזור
      if (areaFilter) {
        const branchAddress = device.branchId?.address || '';
        const branchCity = device.branchId?.city || '';
        const matchArea = branchAddress.includes(areaFilter) || branchCity.includes(areaFilter);
        if (!matchArea) return false;
      }

      // סינון לפי סטטוס
      if (statusFilter && device.refillStatus !== statusFilter) {
        return false;
      }

      // חיפוש חופשי
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const customerName = device.branchId?.customerId?.name?.toLowerCase() || '';
        const branchName = device.branchId?.branchName?.toLowerCase() || '';
        const deviceType = device.deviceType?.toLowerCase() || '';
        const location = device.locationInBranch?.toLowerCase() || '';

        if (!customerName.includes(query) &&
            !branchName.includes(query) &&
            !deviceType.includes(query) &&
            !location.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [devices, areaFilter, statusFilter, searchQuery]);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL');
  };

  const getDaysSince = (date) => {
    if (!date) return '-';
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  };

  const getDaysColor = (days) => {
    if (days === '-') return '';
    if (days > 45) return 'text-[var(--color-status-red-text)] font-bold';
    if (days > 30) return 'text-[var(--color-status-amber-text)] font-medium';
    return 'text-[var(--color-status-green-text)]';
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="card !p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* חיפוש */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="חיפוש לקוח, סניף או מכשיר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* סינון אזור */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm bg-white min-h-[44px]"
          >
            {AREAS.map(area => (
              <option key={area.value} value={area.value}>{area.label}</option>
            ))}
          </select>

          {/* סינון סטטוס */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm bg-white min-h-[44px]"
          >
            <option value="">כל הסטטוסים</option>
            <option value="green">תקין</option>
            <option value="yellow">דורש תשומת לב</option>
            <option value="red">דחוף</option>
          </select>

          {/* כפתור איפוס */}
          {(areaFilter || statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setAreaFilter('');
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="btn-secondary text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              נקה סינון
            </button>
          )}
        </div>

        {/* סיכום תוצאות */}
        <div className="mt-3 text-sm text-[var(--color-text-muted)]">
          מציג {filteredDevices.length} מתוך {devices?.length || 0} מכשירים
        </div>
      </div>

      {/* Empty State */}
      {filteredDevices.length === 0 ? (
        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[var(--color-text-muted)] text-lg">לא נמצאו מכשירים</p>
          {(areaFilter || statusFilter || searchQuery) && (
            <p className="text-sm text-gray-400 mt-2">נסה לשנות את הסינון</p>
          )}
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border-light)]">
          <table className="w-full bg-white">
            <thead className="bg-[var(--color-bg)]">
              <tr>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  לקוח
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  סניף
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  סוג מכשיר
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden md:table-cell">
                  מיקום
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden lg:table-cell">
                  ריח
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  מילוי אחרון
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  ימים
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {filteredDevices.map((device) => {
                const days = getDaysSince(device.lastRefillDate);
                return (
                  <tr
                    key={device._id}
                    className="hover:bg-[var(--color-primary-50)] cursor-pointer transition-colors"
                    onClick={() => onRowClick?.(device)}
                  >
                    <td className="px-4 py-4">
                      <StatusBadge status={device.refillStatus} showText={false} />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--color-text-primary)]">
                      {device.branchId?.customerId?.name || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                      {device.branchId?.branchName || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--color-text-primary)]">
                      {device.deviceType}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-text-muted)] hidden md:table-cell">
                      {device.locationInBranch || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-text-primary)] hidden lg:table-cell">
                      {device.scentId?.name || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                      {formatDate(device.lastRefillDate)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={getDaysColor(days)}>
                        {days}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
