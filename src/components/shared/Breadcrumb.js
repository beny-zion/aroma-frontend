'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function Breadcrumb({ items }) {
  if (!items || items.length === 0) return null;

  const lastIndex = items.length - 1;

  // On mobile (handled via CSS), collapse middle items if more than 3
  const shouldCollapse = items.length > 3;

  return (
    <nav aria-label="breadcrumb" className="flex items-center flex-wrap gap-1 text-sm mb-4">
      {items.map((item, index) => {
        const isLast = index === lastIndex;
        const isFirst = index === 0;
        // On mobile: show first, last two, and ellipsis for middle items
        const isMiddle = !isFirst && index < lastIndex - 1;

        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronLeft
                className="w-4 h-4 shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
              />
            )}

            {/* Collapse middle items on mobile */}
            {shouldCollapse && isMiddle ? (
              <span className="breadcrumb-middle">
                {isLast ? null : (
                  <Link
                    href={item.href}
                    className="hover:underline transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {item.label}
                  </Link>
                )}
              </span>
            ) : isLast ? (
              <span
                className="font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:underline transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
