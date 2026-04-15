'use client';

export default function ChatTypingIndicator() {
  return (
    <div className="flex items-start gap-2 px-4 py-2">
      <div className="bg-gray-100 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
        <div className="flex gap-1.5 items-center">
          <span className="text-xs text-gray-400 ml-2">חושב</span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
