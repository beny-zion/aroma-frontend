'use client';

import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatTypingIndicator from './ChatTypingIndicator';
import { MessageCircle } from 'lucide-react';

export default function ChatMessageList({ messages, isSending, onNavigate }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary-50)] flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          שלום! אני העוזר של ארומה פלוס
        </h3>
        <p className="text-sm text-gray-400 max-w-[280px]">
          אני יכול לעזור לך עם מידע על סניפים, מכשירים, לקוחות, תחזוקה ועוד.
        </p>
        <p className="text-[11px] text-gray-300 mt-1 max-w-[280px]">
          טיפ: לתוצאות מדויקות יותר, עדיף שיחות קצרות וממוקדות
        </p>
        <div className="mt-6 space-y-2 w-full max-w-[280px]">
          {[
            'מה המצב הכללי של המערכת?',
            'אילו מכשירים דורשים מילוי דחוף?',
            'תן סקירת תחזוקה לתל אביב'
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onNavigate?.(suggestion)}
              className="w-full text-right text-xs text-[var(--color-primary)] bg-[var(--color-primary-50)] hover:bg-[var(--color-primary-100)] rounded-lg px-3 py-2 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-3 space-y-1">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} onNavigate={onNavigate} />
      ))}
      {isSending && <ChatTypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
