import { useRef, useCallback, useEffect } from 'react';
import io from 'socket.io-client';
import useChatStore from '../store/chatStore';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Centralized chat logic hook — manages socket.io connection,
 * message sending/receiving, and streaming chunks.
 */
export default function useChat() {
  const socketRef = useRef(null);
  const cleanResponseRef = useRef('');

  const {
    activeChatId,
    addMessage,
    updateLastBotMessage,
    finalizeBotMessage,
    setTyping,
    setLastBotMessage,
  } = useChatStore();

  // Connect socket once
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(BACKEND);
    }
    return () => {
      // Don't disconnect on unmount — keep connection alive
    };
  }, []);

  const sendMessage = useCallback(
    (text, lang = 'en-US', isVoiceInput = false) => {
      if (!text.trim()) return;
      const socket = socketRef.current;
      if (!socket) return;

      let chatId = useChatStore.getState().activeChatId;
      const state = useChatStore.getState();
      
      if (!chatId || !state.chats[chatId]) {
        chatId = state.createChat();
      }

      // Add user message
      addMessage(chatId, {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
        type: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString(),
        lang,
      });

      setTyping(true);
      cleanResponseRef.current = '';

      const onChunk = (chunk) => {
        cleanResponseRef.current += chunk;
        updateLastBotMessage(chatId, cleanResponseRef.current);
      };

      const onDone = () => {
        setTyping(false);
        finalizeBotMessage(chatId, cleanResponseRef.current);
        setLastBotMessage({ text: cleanResponseRef.current, forceSpeak: isVoiceInput, id: Date.now() });
        cleanup();
      };

      const onError = (err) => {
        setTyping(false);
        addMessage(chatId, {
          id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
          type: 'system',
          content: err || '❌ AI error occurred',
          timestamp: new Date().toLocaleTimeString(),
        });
        cleanup();
      };

      const cleanup = () => {
        socket.off('chat_chunk', onChunk);
        socket.off('chat_done', onDone);
        socket.off('chat_error', onError);
      };

      socket.on('chat_chunk', onChunk);
      socket.on('chat_done', onDone);
      socket.on('chat_error', onError);

      socket.emit('send_message', { text, lang });
    },
    [addMessage, updateLastBotMessage, finalizeBotMessage, setTyping, setLastBotMessage]
  );

  const stopGeneration = useCallback(() => {
    socketRef.current?.emit('stop_generation');
    setTyping(false);
  }, [setTyping]);

  return { sendMessage, stopGeneration };
}
