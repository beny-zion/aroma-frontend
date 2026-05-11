'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Calendar, Droplets, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/technician/tasks',    label: 'משימות',     icon: ClipboardList },
  { href: '/technician/calendar', label: 'יומן',       icon: Calendar },
  { href: '/technician/refill',   label: 'מילוי מהיר', icon: Droplets },
  { href: '/technician/profile',  label: 'פרופיל',     icon: User },
];

export default function TechnicianBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-card border-t shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors min-h-14',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'fill-primary/15')} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
