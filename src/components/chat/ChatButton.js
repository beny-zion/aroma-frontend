'use client';

import { MessageCircle, X } from 'lucide-react';

export default function ChatButton({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
        isOpen
          ? 'bg-gray-600 hover:bg-gray-700 text-white'
          : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white'
      } md:bottom-8 md:left-8`}
      title={isOpen ? 'סגור צ׳אט' : 'עוזר AI'}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <MessageCircle className="w-6 h-6" />
      )}
    </button>
  );
}
