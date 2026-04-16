'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export function useAnalytics() {
  const pathname = usePathname();
  const prevPathname = useRef(null);

  // Auto-track page views on navigation
  useEffect(() => {
    // Don't track the analytics dashboard itself
    if (pathname?.startsWith('/admin')) return;

    // Avoid duplicate tracking
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    trackEvent('page_view', { page: pathname });
  }, [pathname]);

  // Manual action tracking
  const trackAction = (action, metadata = {}) => {
    trackEvent('action', { page: pathname, action, metadata });
  };

  return { trackAction };
}
