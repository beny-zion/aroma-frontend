'use client';

/**
 * PageHeader — consistent header for all list/detail pages.
 * Slots: title (required), subtitle, icon, and right-side actions.
 */
export default function PageHeader({ title, subtitle, icon: Icon, count, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-1">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-[var(--brand-50)] flex items-center justify-center shrink-0">
            <Icon className="h-4.5 w-4.5 text-[var(--brand-hover)]" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--text-strong)] flex items-center gap-2">
            {title}
            {count !== undefined && count !== null && (
              <span className="text-[var(--text-soft)] font-medium text-sm font-tabular">
                ({count.toLocaleString('he-IL')})
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="text-[12.5px] text-[var(--text-soft)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">{children}</div>
      )}
    </div>
  );
}
