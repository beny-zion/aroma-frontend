'use client';

import { useState, useCallback, useRef } from 'react';
import { chatAPI } from '@/lib/api';

export default function useChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'conversation'
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationTitle, setConversationTitle] = useState('שיחה חדשה');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const abortRef = useRef(null);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await chatAPI.getConversations({ limit: 30 });
      setConversations(res.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const selectConversation = useCallback(async (id) => {
    setIsLoading(true);
    try {
      const conversation = await chatAPI.getConversation(id);
      setActiveConversationId(conversation._id);
      setMessages(conversation.messages || []);
      setConversationTitle(conversation.title || '\u05E9\u05D9\u05D7\u05D4 \u05D7\u05D3\u05E9\u05D4');
      setView('conversation');
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const newConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setConversationTitle('שיחה חדשה');
    setView('conversation');
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isSending) return;

    // Add user message optimistically
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await chatAPI.sendMessage({
        conversationId: activeConversationId,
        message: text
      });

      // Set conversation ID if new conversation
      if (!activeConversationId && res.conversationId) {
        setActiveConversationId(res.conversationId);
      }

      // Update title if returned
      if (res.title) {
        setConversationTitle(res.title);
      }

      // Add assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.message.content,
        entityLinks: res.message.entityLinks,
        toolCalls: res.message.toolCalls,
        timestamp: res.message.timestamp
      }]);
    } catch (err) {
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E2\u05D9\u05D1\u05D5\u05D3 \u05D4\u05D4\u05D5\u05D3\u05E2\u05D4. \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsSending(false);
    }
  }, [activeConversationId, isSending]);

  const archiveConversation = useCallback(async (id) => {
    try {
      await chatAPI.archiveConversation(id);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
        setView('list');
      }
    } catch (err) {
      console.error('Failed to archive conversation:', err);
    }
  }, [activeConversationId]);

  const goToList = useCallback(() => {
    setView('list');
    loadConversations();
  }, [loadConversations]);

  return {
    isOpen,
    view,
    conversations,
    activeConversationId,
    messages,
    conversationTitle,
    isLoading,
    isSending,
    loadingConversations,
    toggleChat,
    closeChat,
    loadConversations,
    selectConversation,
    newConversation,
    sendMessage,
    archiveConversation,
    goToList
  };
}
