'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';
import RefillProgressBar from './RefillProgressBar';
import QuickRefillModal from './QuickRefillModal';

// אייקונים לפי סוג מכשיר
const deviceIcons = {
  'מפזר': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  'אפליקציה': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  'מרסס': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
  'default': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  )
};

// פונקציה לקבלת אייקון לפי סוג
function getDeviceIcon(deviceType) {
  if (!deviceType) return deviceIcons.default;

  const type = deviceType.toLowerCase();
  if (type.includes('אפליקציה') || type.includes('app')) return deviceIcons['אפליקציה'];
  if (type.includes('מרסס') || type.includes('spray')) return deviceIcons['מרסס'];
  if (type.includes('מפזר') || type.includes('diffuser')) return deviceIcons['מפזר'];

  return deviceIcons.default;
}

// פונקציה לקבלת צבע לפי סטטוס
function getStatusColor(status) {
  switch (status) {
    case 'green': return 'text-[var(--color-status-green-text)] bg-[var(--color-status-green-bg)]';
    case 'yellow': return 'text-[var(--color-status-amber-text)] bg-[var(--color-status-amber-bg)]';
    case 'red': return 'text-[var(--color-status-red-text)] bg-[var(--color-status-red-bg)]';
    default: return 'text-gray-500 bg-gray-100';
  }
}

export default function DeviceCard({ device, onClick, onRefillComplete }) {
  const [showRefillModal, setShowRefillModal] = useState(false);

  const {
    _id,
    deviceType,
    locationInBranch,
    branchId,
    scentId,
    lastRefillDate,
    nextScheduledRefill,
    refillStatus
  } = device;

  // חישוב ימים מאז המילוי האחרון
  const daysSinceRefill = lastRefillDate
    ? Math.floor((new Date() - new Date(lastRefillDate)) / (1000 * 60 * 60 * 24))
    : null;

  // פורמט תאריך
  const formatDate = (date) => {
    if (!date) return 'לא ידוע';
    return new Date(date).toLocaleDateString('he-IL');
  };

  const handleQuickRefill = (e) => {
    e.stopPropagation();
    setShowRefillModal(true);
  };

  const handleRefillSuccess = (data) => {
    setShowRefillModal(false);
    onRefillComplete?.(data);
  };

  return (
    <>
      <div
        className="card cursor-pointer hover:shadow-lg transition-all group"
        onClick={() => onClick?.(device)}
      >
        {/* Header עם אייקון וסטטוס */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* אייקון מכשיר */}
            <div className={`p-2.5 rounded-xl ${getStatusColor(refillStatus)}`}>
              {getDeviceIcon(deviceType)}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">
                {deviceType}
              </h3>
              {locationInBranch && (
                <p className="text-[var(--color-text-muted)] text-sm">{locationInBranch}</p>
              )}
            </div>
          </div>
          <StatusBadge status={refillStatus} />
        </div>

        {/* Progress Bar - מצב מילוי ויזואלי */}
        {daysSinceRefill !== null && (
          <div className="mb-4">
            <RefillProgressBar daysSinceRefill={daysSinceRefill} />
          </div>
        )}

        {/* פרטי המכשיר */}
        <div className="space-y-2.5 text-sm">
          {branchId && (
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-muted)]">סניף:</span>
              <span className="text-[var(--color-text-primary)] font-medium">
                {branchId.branchName || '-'}
              </span>
            </div>
          )}

          {scentId && (
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-muted)]">ריח:</span>
              <span className="text-[var(--color-text-primary)]">{scentId.name || '-'}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">מילוי אחרון:</span>
            <span className="text-[var(--color-text-primary)]">{formatDate(lastRefillDate)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">מילוי הבא:</span>
            <span className="text-[var(--color-text-primary)]">{formatDate(nextScheduledRefill)}</span>
          </div>
        </div>

        {/* Quick Action - כפתור מילוי מהיר */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
          <button
            onClick={handleQuickRefill}
            className="btn-quick-action w-full"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            ביצעתי מילוי
          </button>
        </div>
      </div>

      {/* Modal למילוי מהיר */}
      {showRefillModal && (
        <QuickRefillModal
          device={device}
          onClose={() => setShowRefillModal(false)}
          onSuccess={handleRefillSuccess}
        />
      )}
    </>
  );
}
