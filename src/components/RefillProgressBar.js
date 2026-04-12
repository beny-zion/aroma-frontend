'use client';

/**
 * Refill Progress Bar Component
 * פס התקדמות ויזואלי למצב מילוי המכשיר
 *
 * 0-30 יום: ירוק
 * 31-45 יום: כתום
 * 45+: אדום מהבהב
 */
export default function RefillProgressBar({ daysSinceRefill, maxDays = 60 }) {
  // חישוב אחוז ההתקדמות (מקסימום 100%)
  const percentage = Math.min((daysSinceRefill / maxDays) * 100, 100);

  // קביעת צבע לפי מספר הימים
  const getProgressClass = () => {
    if (daysSinceRefill <= 30) return 'progress-bar-green';
    if (daysSinceRefill <= 45) return 'progress-bar-amber';
    return 'progress-bar-red';
  };

  // קביעת טקסט לפי מספר הימים
  const getStatusText = () => {
    if (daysSinceRefill <= 30) return 'תקין';
    if (daysSinceRefill <= 45) return 'דורש מילוי בקרוב';
    return 'דחוף!';
  };

  return (
    <div className="space-y-1.5">
      {/* כותרת עם ימים */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--color-text-muted)]">{getStatusText()}</span>
        <span className={`font-medium ${
          daysSinceRefill > 45 ? 'text-[var(--color-status-red-text)]' :
          daysSinceRefill > 30 ? 'text-[var(--color-status-amber-text)]' :
          'text-[var(--color-status-green-text)]'
        }`}>
          {daysSinceRefill} ימים
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className={`progress-bar ${getProgressClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* סקלה */}
      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>0</span>
        <span>30</span>
        <span>45</span>
        <span>60</span>
      </div>
    </div>
  );
}
