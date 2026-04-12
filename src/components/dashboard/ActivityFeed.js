'use client';

import {
  Droplets,
  Wrench,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  User
} from 'lucide-react';

const SERVICE_TYPE_CONFIG = {
  refill: {
    icon: Droplets,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    label: 'מילוי'
  },
  repair: {
    icon: Wrench,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
    label: 'תיקון'
  },
  installation: {
    icon: Plus,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'התקנה'
  },
  removal: {
    icon: Minus,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'הסרה'
  },
  replacement: {
    icon: RefreshCw,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    label: 'החלפה'
  }
};

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays === 1) return 'אתמול';
  if (diffDays < 7) return `לפני ${diffDays} ימים`;

  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short'
  });
}

export default function ActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">פעילות אחרונה</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>אין פעילות אחרונה</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">פעילות אחרונה</h3>
        <span className="text-sm text-gray-500">{activities.length} אירועים</span>
      </div>

      <div className="space-y-1">
        {activities.map((activity, index) => {
          const config = SERVICE_TYPE_CONFIG[activity.type] || SERVICE_TYPE_CONFIG.refill;
          const Icon = config.icon;

          return (
            <div
              key={activity.id || index}
              className="relative flex gap-4 py-3 group"
            >
              {/* Timeline connector */}
              {index < activities.length - 1 && (
                <div className="absolute right-5 top-12 bottom-0 w-0.5 bg-gray-100" />
              )}

              {/* Icon */}
              <div className={`relative z-10 p-2.5 rounded-xl ${config.bgColor} shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {activity.message}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(activity.date)}
                  </span>

                  {activity.technicianName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {activity.technicianName}
                    </span>
                  )}

                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length >= 10 && (
        <a
          href="/service-logs"
          className="mt-4 flex items-center justify-center gap-2 py-2 text-sm text-sage-600 hover:text-sage-700 font-medium transition-colors"
        >
          צפה בכל הפעילות
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}
