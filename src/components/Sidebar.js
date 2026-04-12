'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Cpu, Users, Building2, Droplets,
  PlusCircle, FileText, ClipboardList, UserCog, Settings,
  LogOut, Menu, X
} from 'lucide-react';

const roleLabels = {
  admin: 'מנהל',
  manager: 'מנהל משרד',
  technician: 'טכנאי'
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuSections = [
    {
      items: [
        { href: '/', label: 'דשבורד', icon: LayoutDashboard },
        { href: '/devices', label: 'מכשירים', icon: Cpu },
        { href: '/customers', label: 'לקוחות', icon: Users },
        { href: '/branches', label: 'סניפים', icon: Building2 },
        { href: '/scents', label: 'ריחות', icon: Droplets },
      ]
    },
    {
      items: [
        { href: '/refill', label: 'ביצוע מילוי', icon: PlusCircle, highlight: true },
        { href: '/service-logs', label: 'יומן שירות', icon: FileText },
        { href: '/work-orders', label: 'הזמנות עבודה', icon: ClipboardList, roles: ['admin', 'manager'] },
        { href: '/my-tasks', label: 'המשימות שלי', icon: ClipboardList, roles: ['technician'] },
      ]
    },
    {
      items: [
        { href: '/users', label: 'משתמשים', icon: UserCog, roles: ['admin'] },
        { href: '/device-types', label: 'סוגי מכשירים', icon: Settings },
      ]
    }
  ];

  // Filter items by role
  const getVisibleItems = (items) => {
    return items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(user?.role);
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderMenuItem = (item, isMobile = false) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          className={`flex items-center gap-3 ${isMobile ? 'p-4 min-h-[56px]' : 'p-3'} rounded-xl transition-all ${
            isActive
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : item.highlight
                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-dark)] border border-[var(--color-primary-200)] hover:bg-[var(--color-primary-100)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
          <span className="font-medium">{item.label}</span>
          {isActive && !isMobile && (
            <span className="mr-auto w-2 h-2 bg-white rounded-full opacity-80"></span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 right-0 left-0 z-50 bg-white border-b border-[var(--color-border-light)]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[var(--color-primary)]">ארומה פלוס</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn-icon"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div className={`md:hidden fixed top-[73px] right-0 left-0 bottom-0 bg-white z-40 transform transition-transform duration-300 flex flex-col ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <nav className="p-4 flex-1 overflow-y-auto">
          {menuSections.map((section, sIdx) => {
            const visibleItems = getVisibleItems(section.items);
            if (visibleItems.length === 0) return null;
            return (
              <div key={sIdx}>
                {sIdx > 0 && <hr className="my-3 border-[var(--color-border-light)]" />}
                <ul className="space-y-2">
                  {visibleItems.map((item) => renderMenuItem(item, true))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Mobile footer */}
        {user && (
          <div className="p-4 border-t border-[var(--color-border-light)] bg-[var(--color-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{user.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{roleLabels[user.role] || user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                יציאה
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg min-h-screen fixed right-0 z-40 border-l border-[var(--color-border-light)]">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border-light)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-primary)]">ארומה פלוס</h1>
              <p className="text-xs text-[var(--color-text-muted)]">מערכת ניהול</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuSections.map((section, sIdx) => {
            const visibleItems = getVisibleItems(section.items);
            if (visibleItems.length === 0) return null;
            return (
              <div key={sIdx}>
                {sIdx > 0 && <hr className="my-3 border-[var(--color-border-light)]" />}
                <ul className="space-y-1">
                  {visibleItems.map((item) => renderMenuItem(item, false))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer with user info */}
        {user && (
          <div className="p-4 border-t border-[var(--color-border-light)] bg-[var(--color-bg)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--color-primary-dark)]">
                  {user.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{roleLabels[user.role] || user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              יציאה מהמערכת
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
