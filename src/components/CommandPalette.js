'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAllCustomers, useBranches, useAllDevices } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut
} from '@/components/ui/command';
import {
  Building2, Users, Cpu, Droplets, ClipboardList, CalendarDays,
  LayoutDashboard, FileText, UserCog, PlusCircle, Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'דשבורד', icon: LayoutDashboard, keywords: ['dashboard', 'home'], roles: ['admin', 'manager'] },
  { href: '/customers', label: 'לקוחות', icon: Users, keywords: ['customers'] },
  { href: '/branches', label: 'סניפים', icon: Building2, keywords: ['branches'] },
  { href: '/devices', label: 'מכשירים', icon: Cpu, keywords: ['devices'] },
  { href: '/scents', label: 'ריחות', icon: Droplets, keywords: ['scents', 'inventory'] },
  { href: '/work-orders', label: 'הזמנות עבודה', icon: ClipboardList, keywords: ['work', 'orders'], roles: ['admin', 'manager', 'secretary'] },
  { href: '/schedule', label: 'הזמנות עבודה — לוח שבועי', icon: CalendarDays, keywords: ['schedule', 'route', 'weekly'], roles: ['admin', 'manager', 'secretary'] },
  { href: '/my-tasks', label: 'המשימות שלי', icon: ClipboardList, keywords: ['my', 'tasks'], roles: ['technician'] },
  { href: '/service-logs', label: 'יומן שירות', icon: FileText, keywords: ['service', 'logs'] },
  { href: '/refill', label: 'מילוי מהיר', icon: PlusCircle, keywords: ['refill', 'quick'] },
  { href: '/users', label: 'משתמשים', icon: UserCog, keywords: ['users'], roles: ['admin'] },
  { href: '/device-types', label: 'סוגי מכשירים', icon: Settings, keywords: ['device', 'types'] },
];

export default function CommandPalette({ open, onOpenChange }) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="חיפוש מהיר" description="חפש כל ישות במערכת">
      {open && <PaletteContent onOpenChange={onOpenChange} />}
    </CommandDialog>
  );
}

function PaletteContent({ onOpenChange }) {
  const router = useRouter();
  const { user } = useAuth();
  const { customers } = useAllCustomers();
  const { branches } = useBranches();
  const { devices } = useAllDevices();

  function go(href) {
    onOpenChange(false);
    router.push(href);
  }

  const visibleNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <Command>
      <CommandInput placeholder="חפש לקוח / סניף / מכשיר / מסך..." />
        <CommandList>
          <CommandEmpty>לא נמצאו תוצאות.</CommandEmpty>

          <CommandGroup heading="ניווט">
            {visibleNav.map(item => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={`${item.label} ${item.keywords?.join(' ') || ''}`}
                  onSelect={() => go(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {customers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={`לקוחות (${customers.length})`}>
                {customers.slice(0, 50).map(c => (
                  <CommandItem
                    key={c._id}
                    value={`לקוח ${c.name}`}
                    onSelect={() => go(`/customers/${c._id}`)}
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {branches.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={`סניפים (${branches.length})`}>
                {branches.slice(0, 50).map(b => (
                  <CommandItem
                    key={b._id}
                    value={`סניף ${b.branchName} ${b.city || ''} ${b.region || ''} ${b.customerId?.name || ''}`}
                    onSelect={() => go(`/branches/${b._id}`)}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span>{b.branchName}</span>
                      <span className="text-xs text-muted-foreground">{b.city || ''}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {devices.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={`מכשירים (${devices.length})`}>
                {devices.slice(0, 50).map(d => (
                  <CommandItem
                    key={d._id}
                    value={`מכשיר ${d.deviceType} ${d.locationInBranch || ''} ${d.branchId?.branchName || ''}`}
                    onSelect={() => go(`/devices/${d._id}`)}
                  >
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span>
                        {d.deviceType}
                        {d.locationInBranch && <span className="text-muted-foreground"> · {d.locationInBranch}</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">{d.branchId?.branchName || ''}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
      </CommandList>
    </Command>
  );
}

/**
 * Trigger button to display in the topbar.
 * Renders "חפש... ⌘K" pill that opens the palette on click.
 */
export function CommandPaletteTrigger({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 h-9 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border rounded-md transition-colors w-48 md:w-64"
    >
      <span className="text-xs">חפש לקוח / סניף / מכשיר...</span>
      <kbd className="ms-auto inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
        <span>⌘</span>K
      </kbd>
    </button>
  );
}
