'use client';

/**
 * Status Badge Component
 * מציג תג צבעוני לפי סטטוס המילוי
 *
 * ירוק - מולא ב-20 יום האחרונים
 * צהוב - מולא לפני 30-40 יום
 * אדום מהבהב - מעל 45 יום
 */
export default function StatusBadge({ status, showText = true }) {
  const config = {
    green: {
      className: 'status-badge-green',
      text: 'תקין',
      icon: '✓'
    },
    yellow: {
      className: 'status-badge-yellow',
      text: 'דורש תשומת לב',
      icon: '⚠'
    },
    red: {
      className: 'status-badge-red',
      text: 'דחוף!',
      icon: '🔴'
    },
    unknown: {
      className: 'status-badge bg-gray-100 text-gray-600',
      text: 'לא ידוע',
      icon: '?'
    }
  };

  const { className, text, icon } = config[status] || config.unknown;

  return (
    <span className={className}>
      <span className="ml-1">{icon}</span>
      {showText && <span>{text}</span>}
    </span>
  );
}
