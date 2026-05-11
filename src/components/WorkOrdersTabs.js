'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/work-orders', label: 'רשימה', icon: ClipboardList },
  { href: '/schedule', label: 'לוח שבועי', icon: CalendarDays },
];

export default function WorkOrdersTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 border-b">
      {TABS.map(tab => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
