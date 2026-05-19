'use client';

import ChatEntityLink from './ChatEntityLink';

// Combined regex matches both entity links (24-char hex id) and page links (path).
// Capture groups: 1=type, 2=id-or-path, 3=displayName
const LINK_REGEX = /\[\[(customer|branch|device|work-order|scent|technician|user|service-request):([a-f0-9]{24}):([^\]]+)\]\]|\[\[(page):(\/[a-zA-Z0-9\/_\-]*):([^\]]+)\]\]/g;

function parseMessageContent(content, onNavigate) {
  if (!content) return null;

  const parts = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(LINK_REGEX.source, LINK_REGEX.flags);

  while ((match = regex.exec(content)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Either entity-style (groups 1-3) or page-style (groups 4-6) matched
    const type = match[1] || match[4];
    const entityId = match[2] || match[5];
    const displayName = match[3] || match[6];

    parts.push(
      <ChatEntityLink
        key={`link-${match.index}`}
        type={type}
        entityId={entityId}
        displayName={displayName}
        onNavigate={onNavigate}
      />
    );

    lastIndex = match.index + match[0].length;
  }

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
