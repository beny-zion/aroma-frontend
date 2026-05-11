'use client';

/**
 * Subtle "Built by Ready Systems" credit footer.
 * Styled to feel like a quiet signature — fades on hover.
 *
 * Two variants:
 *   - default (`variant="dark"`): dark background frame, suits login page
 *   - "light":   transparent background, suits sidebars and in-app footers
 */
export default function ReadySystemsCredit({ variant = 'light' }) {
  const isDark = variant === 'dark';
  return (
    <div
      className={`flex justify-center items-center py-3 px-4 ${
        isDark ? 'bg-[#1A1A1A]' : 'bg-transparent'
      }`}
    >
      <a
        href="https://ready-systems.dev"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="פיתוח אתרים ומערכות על ידי Ready Systems"
        className={`group inline-flex items-center gap-2 text-[11px] font-light tracking-wider no-underline transition-colors ${
          isDark
            ? 'text-white/45 hover:text-white'
            : 'text-muted-foreground/60 hover:text-foreground'
        }`}
        style={{ letterSpacing: '0.04em' }}
      >
        <span>פיתוח אתרים ומערכות ·</span>
        <img
          src="/ready-systems-logo.png"
          alt=""
          className="h-5 w-5 opacity-70 transition-all group-hover:opacity-100 group-hover:scale-110"
        />
        <span className="font-medium opacity-80 group-hover:opacity-100" style={{ letterSpacing: '0.06em' }}>
          Ready Systems
        </span>
      </a>
    </div>
  );
}
