'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const ENTITY_ROUTES = {
  'customer': (id) => `/customers/${id}`,
  'branch': (id) => `/branches/${id}`,
  'device': (id) => `/devices/${id}`,
  'work-order': (id) => `/work-orders`,
  'scent': () => `/scents`
};

export default function ChatEntityLink({ type, entityId, displayName, onNavigate }) {
  const getRoute = ENTITY_ROUTES[type];
  if (!getRoute) return <span>{displayName}</span>;

  const href = getRoute(entityId);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="inline-flex items-center gap-0.5 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium underline underline-offset-2 decoration-[var(--color-primary-200)] hover:decoration-[var(--color-primary)] transition-colors"
    >
      {displayName}
      <ExternalLink className="w-3 h-3 inline-block" />
    </Link>
  );
}
