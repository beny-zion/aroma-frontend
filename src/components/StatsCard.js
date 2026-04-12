'use client';

// אייקונים לפי סוג
const icons = {
  devices: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  urgent: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  stock: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  service: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
};

/**
 * Stats Card Component
 * כרטיס סטטיסטיקה לדשבורד - Premium Design
 */
export default function StatsCard({
  title,
  value,
  subtitle,
  color = 'primary',
  icon,
  trend,
  onClick
}) {
  // הגדרות צבע לפי סוג
  const colorConfig = {
    primary: {
      bg: 'bg-(--color-primary-50)',
      border: 'border-(--color-primary-200)',
      text: 'text-(--color-primary)',
      iconBg: 'bg-(--color-primary-100)',
      iconColor: 'text-(--color-primary-dark)'
    },
    green: {
      bg: 'bg-(--color-status-green-bg)',
      border: 'border-green-200',
      text: 'text-(--color-status-green-text)',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    yellow: {
      bg: 'bg-(--color-status-amber-bg)',
      border: 'border-amber-200',
      text: 'text-(--color-status-amber-text)',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    red: {
      bg: 'bg-(--color-status-red-bg)',
      border: 'border-red-200',
      text: 'text-(--color-status-red-text)',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-500'
    }
  };

  const config = colorConfig[color] || colorConfig.primary;

  // בחירת אייקון
  const getIcon = () => {
    if (typeof icon === 'string') {
      // אם זה מפתח לאייקון מוגדר מראש
      if (icons[icon]) return icons[icon];
      // אם זה אמוג'י, נחזיר אותו כטקסט
      return <span className="text-2xl">{icon}</span>;
    }
    // אם זה קומפוננטת React
    if (icon) return icon;
    // ברירת מחדל
    return icons.devices;
  };

  return (
    <div
      className={`card border-2 ${config.border} ${config.bg} ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} transition-all`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        {/* תוכן */}
        <div className="flex-1">
          <p className="text-sm text-(--color-text-secondary) font-medium">{title}</p>
          <p className={`text-4xl font-bold mt-2 ${config.text}`}>{value}</p>
          {subtitle && (
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span className={`text-xs font-medium ${
                  trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
              <p className="text-sm text-(--color-text-muted)">{subtitle}</p>
            </div>
          )}
        </div>

        {/* אייקון */}
        <div className={`p-3 rounded-xl ${config.iconBg}`}>
          <div className={config.iconColor}>
            {getIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}
