'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import SplashScreen from './SplashScreen';
import ServerLoadingScreen from './ServerLoadingScreen';
import { LogOut } from 'lucide-react';
import ChatButton from './chat/ChatButton';
import ChatDrawer from './chat/ChatDrawer';
import useChat from '@/hooks/useChat';

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
  const chat = useChat();

  const showChat = user?.role === 'admin' || user?.role === 'manager';

  const isLoginPage = pathname === '/login';
  const shouldRedirectToHome = isLoginPage && !loading && user;
  const shouldRedirectToLogin = !isLoginPage && !loading && !user;

  useEffect(() => {
    if (shouldRedirectToHome) {
      router.replace('/');
    } else if (shouldRedirectToLogin) {
      router.replace('/login');
    }
  }, [shouldRedirectToHome, shouldRedirectToLogin, router]);

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

  // Full-screen loading during initial auth check (skip for login page)
  if ((!isLoginPage && loading) || shouldRedirectToHome || shouldRedirectToLogin) {
    return <ServerLoadingScreen />;
  }

  // Login page - no sidebar, full screen
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Normal authenticated layout
  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 mr-0 md:mr-64 pt-20 md:pt-0 pb-8 max-w-full overflow-x-hidden">
          {/* Top header bar */}
          <div className="hidden md:flex items-center justify-end gap-3 px-6 lg:px-8 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-400 leading-tight">{roleLabels[user?.role] || user?.role}</p>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-dark)' }}
              >
                {user?.name?.charAt(0)}
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="יציאה מהמערכת"
            >
              <LogOut className="w-4 h-4" />
              <span>יציאה</span>
            </button>
          </div>

          {/* Page content */}
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
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
