'use client';

import { useEffect } from 'react';
import { ArrowRight, Bot, X } from 'lucide-react';
import ChatConversationList from './ChatConversationList';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';

export default function ChatDrawer({
  isOpen,
  view,
  conversations,
  messages,
  conversationTitle,
  isLoading,
  isSending,
  loadingConversations,
  onClose,
  onSendMessage,
  onSelectConversation,
  onNewConversation,
  onArchiveConversation,
  onLoadConversations,
  onGoToList
}) {
  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // Handle suggestion click from empty state
  const handleSuggestionOrNavigate = (textOrUndefined) => {
    if (typeof textOrUndefined === 'string') {
      onSendMessage(textOrUndefined);
    } else {
      // Entity link clicked - close drawer
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop - mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-full md:w-[400px]`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
          {view === 'conversation' && (
            <button
              onClick={onGoToList}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="חזרה לרשימת שיחות"
            >
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-50)] flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {view === 'list' ? 'עוזר AI - ארומה פלוס' : conversationTitle}
            </h3>
            <p className="text-[10px] text-gray-400">
              {view === 'list' ? 'שיחות קודמות' : 'קריאה בלבד · מידע מהמערכת'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="סגור צ'אט"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {view === 'list' ? (
            <ChatConversationList
              conversations={conversations}
              loading={loadingConversations}
              onSelect={onSelectConversation}
              onNew={onNewConversation}
              onArchive={onArchiveConversation}
              onLoadConversations={onLoadConversations}
            />
          ) : (
            <>
              <ChatMessageList
                messages={messages}
                isSending={isSending}
                onNavigate={handleSuggestionOrNavigate}
              />
              <ChatInput
                onSend={onSendMessage}
                disabled={isSending || isLoading}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
