'use client';

import { useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(dateStr).toLocaleDateString('he-IL');
}

export default function ChatConversationList({
  conversations,
  loading,
  onSelect,
  onNew,
  onArchive,
  onLoadConversations
}) {
  useEffect(() => {
    onLoadConversations();
  }, [onLoadConversations]);

  return (
    <div className="flex flex-col h-full">
      {/* New conversation button */}
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          שיחה חדשה
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">אין שיחות עדיין</p>
            <p className="text-xs text-gray-300 mt-1">התחל שיחה חדשה כדי לשאול שאלות</p>
          </div>
        ) : (
          <div className="py-2">
            {conversations.map((conv) => (
              <div
                key={conv._id}
                className="group flex items-center gap-2 mx-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelect(conv._id)}
              >
                <MessageSquare className="w-4 h-4 text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate font-medium">
                    {conv.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatTimeAgo(conv.lastMessageAt)} · {conv.messageCount} הודעות
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(conv._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
                  title="מחק שיחה"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
