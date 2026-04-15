'use client';

import ChatEntityLink from './ChatEntityLink';

const ENTITY_LINK_REGEX = /\[\[(customer|branch|device|work-order|scent):([a-f0-9]{24}):([^\]]+)\]\]/g;

function parseMessageContent(content, onNavigate) {
  if (!content) return null;

  const parts = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(ENTITY_LINK_REGEX.source, ENTITY_LINK_REGEX.flags);

  while ((match = regex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add entity link
    parts.push(
      <ChatEntityLink
        key={`link-${match.index}`}
        type={match[1]}
        entityId={match[2]}
        displayName={match[3]}
        onNavigate={onNavigate}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {content.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : content;
}

export default function ChatMessage({ message, onNavigate }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-1`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[var(--color-primary)] text-white rounded-bl-sm'
            : 'bg-gray-100 text-gray-800 rounded-br-sm'
        }`}
      >
        {isUser ? message.content : parseMessageContent(message.content, onNavigate)}
      </div>
    </div>
  );
}
