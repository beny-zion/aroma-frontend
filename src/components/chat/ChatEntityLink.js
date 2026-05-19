'use client';

import Link from 'next/link';
import { ExternalLink, ArrowLeft } from 'lucide-react';

const ENTITY_ROUTES = {
  'customer': (id) => `/customers/${id}`,
  'branch': (id) => `/branches/${id}`,
  'device': (id) => `/devices/${id}`,
  'work-order': () => `/work-orders`,
  'scent': () => `/scents`,
  'technician': () => `/users`,
  'user': () => `/users`,
  'service-request': () => `/service-requests`,
  // Internal app pages — entityId is the path itself (e.g. "/schedule")
  'page': (path) => path || '/'
};

export default function ChatEntityLink({ type, entityId, displayName, onNavigate }) {
  const getRoute = ENTITY_ROUTES[type];
  if (!getRoute) return <span>{displayName}</span>;

  const href = getRoute(entityId);
  const isPage = type === 'page';

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={
        isPage
          ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-primary-50)] text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-100)] text-[12px] font-medium transition-colors"
          : "inline-flex items-center gap-0.5 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium underline underline-offset-2 decoration-[var(--color-primary-200)] hover:decoration-[var(--color-primary)] transition-colors"
      }
    >
      {isPage ? <ArrowLeft className="w-3 h-3 inline-block" /> : null}
      {displayName}
      {!isPage && <ExternalLink className="w-3 h-3 inline-block" />}
    </Link>
  );
}
