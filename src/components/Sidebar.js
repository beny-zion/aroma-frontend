'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard, Cpu, Users, Building2, Droplets,
  PlusCircle, FileText, ClipboardList, UserCog, Settings,
  LogOut, Menu, CalendarDays, History, Wrench, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const roleLabels = {
  admin: 'אדמין',
  manager: 'מנהל',
  secretary: 'מזכירה',
  technician: 'טכנאי'
};

const menuSections = [
  {
    title: 'ראשי',
    items: [
      // Dashboard hidden from secretary (no profitability view) and technician (mobile UI elsewhere)
      { href: '/', label: 'דשבורד', icon: LayoutDashboard, roles: ['admin', 'manager'] },
      { href: '/devices', label: 'מכשירים', icon: Cpu },
      { href: '/customers', label: 'לקוחות', icon: Users },
      { href: '/branches', label: 'סניפים', icon: Building2 },
      { href: '/scents', label: 'ריחות', icon: Droplets },
    ]
  },
  {
    title: 'תפעול',
    items: [
      { href: '/refill', label: 'מילוי מהיר', icon: PlusCircle, accent: true },
      { href: '/service-logs', label: 'יומן שירות', icon: FileText },
      { href: '/work-orders', label: 'הזמנות עבודה', icon: ClipboardList, roles: ['admin', 'manager', 'secretary'] },
      { href: '/schedule', label: 'לוח שבועי', icon: CalendarDays, roles: ['admin', 'manager', 'secretary'] },
      { href: '/service-requests', label: 'פניות שירות', icon: Wrench, roles: ['admin', 'manager', 'secretary'] },
      { href: '/my-tasks', label: 'המשימות שלי', icon: ClipboardList, roles: ['technician'] },
    ]
  },
  {
    title: 'דוחות',
    items: [
      { href: '/reports', label: 'דוחות כספיים', icon: TrendingUp, roles: ['admin', 'manager'] },
    ]
  },
  {
    title: 'מערכת',
    items: [
      { href: '/users', label: 'משתמשים', icon: UserCog, roles: ['admin'] },
      { href: '/audit-log', label: 'יומן פעילות', icon: History, roles: ['admin', 'manager', 'secretary'] },
      { href: '/device-types', label: 'סוגי מכשירים', icon: Settings, roles: ['admin', 'manager', 'secretary'] },
    ]
  }
];

function NavList({ user, pathname, onNavigate }) {
  const visibleSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || item.roles.includes(user?.role))
    }))
    .filter(section => section.items.length > 0);

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {visibleSections.map((section, sIdx) => (
        <div key={sIdx}>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.title}
          </div>
          <ul className="space-y-0.5">
            {section.items.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : item.accent
                        ? 'text-primary hover:bg-accent'
                        : 'text-foreground/80 hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'opacity-100' : 'opacity-70')} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserFooter({ user, onLogout }) {
  return (
    <div className="border-t p-3">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {user?.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
          <p className="text-[11px] text-muted-foreground">{roleLabels[user?.role] || user?.role}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-1"
      >
        <LogOut className="h-4 w-4" />
        יציאה מהמערכת
      </Button>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden fixed top-0 right-0 left-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <img src="/LogoIcon.svg" alt="ארומה פלוס" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-base font-bold text-primary">ארומה פלוס</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="פתח תפריט" className="!h-11 !w-11">
                <Menu className="!h-7 !w-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2 text-right">
                  <img src="/LogoIcon.svg" alt="" className="h-9 w-9 rounded-lg object-contain" />
                  <span className="text-base font-bold text-primary">ארומה פלוס</span>
                </SheetTitle>
              </SheetHeader>
              <NavList user={user} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              {user && <UserFooter user={user} onLogout={handleLogout} />}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-card h-screen fixed right-0 top-0 z-40 border-l">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2.5">
            <img src="/LogoIcon.svg" alt="ארומה פלוס" className="h-9 w-9 rounded-lg object-contain" />
            <div>
              <h1 className="text-base font-bold text-primary leading-tight">ארומה פלוס</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">מערכת ניהול</p>
            </div>
          </div>
        </div>
        <NavList user={user} pathname={pathname} />
        {user && <UserFooter user={user} onLogout={handleLogout} />}
      </aside>
    </>
  );
}
