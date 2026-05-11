'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import SplashScreen from './SplashScreen';
import ServerLoadingScreen from './ServerLoadingScreen';
import { LogOut, ChevronDown } from 'lucide-react';
import ChatButton from './chat/ChatButton';
import ChatDrawer from './chat/ChatDrawer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import CommandPalette, { CommandPaletteTrigger } from './CommandPalette';
import TechnicianBottomNav from './TechnicianBottomNav';
import useChat from '@/hooks/useChat';
import { useAnalytics } from '@/hooks/useAnalytics';

const roleLabels = {
  admin: 'מנהל',
  manager: 'מנהל משרד',
  technician: 'טכנאי'
};

export default function LayoutShell({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const chat = useChat();
  useAnalytics();

  // Open command palette with Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const showChat = user?.role === 'admin' || user?.role === 'manager';

  const isLoginPage = pathname === '/login';
  const isAdminAnalytics = pathname?.startsWith('/admin');
  const isTechnicianRoute = pathname?.startsWith('/technician');
  const isPublicPage = isLoginPage || isAdminAnalytics;
  const isTechnician = user?.role === 'technician';
  const shouldRedirectToHome = isLoginPage && !loading && user && !isTechnician;
  const shouldRedirectTechToTasks = isLoginPage && !loading && isTechnician;
  const shouldRedirectToLogin = !isPublicPage && !loading && !user;
  // Technicians cannot reach admin/manager routes
  const shouldBounceTechToTasks = !loading && isTechnician && !isTechnicianRoute && !isPublicPage;

  useEffect(() => {
    if (shouldRedirectTechToTasks || shouldBounceTechToTasks) {
      router.replace('/technician/tasks');
    } else if (shouldRedirectToHome) {
      router.replace('/');
    } else if (shouldRedirectToLogin) {
      router.replace('/login');
    }
  }, [shouldRedirectToHome, shouldRedirectTechToTasks, shouldBounceTechToTasks, shouldRedirectToLogin, router]);

  // Check for splash screen trigger
  useEffect(() => {
    if (user && !isLoginPage && !loading) {
      const justLoggedIn = sessionStorage.getItem('aroma_just_logged_in');
      if (justLoggedIn) {
        sessionStorage.removeItem('aroma_just_logged_in');
        setShowSplash(true);
      }
    }
  }, [user, isLoginPage, loading]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Full-screen loading during initial auth check (skip for public pages)
  if ((!isPublicPage && loading) || shouldRedirectToHome || shouldRedirectToLogin || shouldRedirectTechToTasks || shouldBounceTechToTasks) {
    return <ServerLoadingScreen />;
  }

  // Public pages (login, admin analytics) - no sidebar, full screen
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Technician shell — no sidebar, mobile-first, bottom nav
  if (isTechnician && isTechnicianRoute) {
    return (
      <>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <div className="min-h-screen bg-background">
          <main className="max-w-md mx-auto px-3 pt-3 pb-24">
            {children}
          </main>
        </div>
        <TechnicianBottomNav />
      </>
    );
  }

  // Normal authenticated layout
  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 mr-0 md:mr-60 pt-14 md:pt-0 pb-6 max-w-full overflow-x-hidden">
          {/* Top header bar */}
          <div className="hidden md:flex items-center justify-between gap-2 px-6 py-2 border-b bg-card/80 backdrop-blur sticky top-0 z-30">
            <CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-9">
                  <div className="text-left leading-tight">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{roleLabels[user?.role] || user?.role}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {user?.name?.charAt(0)}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  יציאה מהמערכת
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Page content */}
          <div className="p-3 md:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
      {/* Global command palette (Cmd/Ctrl+K) */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* AI Chat - admin/manager only */}
      {showChat && (
        <>
          <ChatButton isOpen={chat.isOpen} onClick={chat.toggleChat} />
          <ChatDrawer
            isOpen={chat.isOpen}
            view={chat.view}
            conversations={chat.conversations}
            messages={chat.messages}
            conversationTitle={chat.conversationTitle}
            isLoading={chat.isLoading}
            isSending={chat.isSending}
            loadingConversations={chat.loadingConversations}
            onClose={chat.closeChat}
            onSendMessage={chat.sendMessage}
            onSelectConversation={chat.selectConversation}
            onNewConversation={chat.newConversation}
            onArchiveConversation={chat.archiveConversation}
            onLoadConversations={chat.loadConversations}
            onGoToList={chat.goToList}
          />
        </>
      )}
    </>
  );
}
