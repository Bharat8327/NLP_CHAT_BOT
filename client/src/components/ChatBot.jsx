import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatBot = () => {
  const [messages, setMessages] = useState([]); // store chat messages
  const [input, setInput] = useState(''); // user input
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const activeListenersRef = useRef(null);

  useEffect(() => {
    // Create socket inside component lifecycle
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');
    
    return () => {
      // Clean up listeners and disconnect on unmount
      if (activeListenersRef.current && socketRef.current) {
        socketRef.current.off('chat_chunk', activeListenersRef.current.onChunk);
        socketRef.current.off('chat_done', activeListenersRef.current.onDone);
        socketRef.current.off('chat_error', activeListenersRef.current.onError);
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const socket = socketRef.current;
    if (!socket) return;

    // Clean up previous listeners
    if (activeListenersRef.current) {
      socket.off('chat_chunk', activeListenersRef.current.onChunk);
      socket.off('chat_done', activeListenersRef.current.onDone);
      socket.off('chat_error', activeListenersRef.current.onError);
      activeListenersRef.current = null;
    }

    const userMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]); // add user msg to UI

    // reset
    const sentText = input;
    setInput('');
    setIsTyping(true);

    let cleanResponse = '';

    const onChunk = (chunk) => {
      const filteredChunk = chunk.replace(/\\\\/g, '').trim();
      cleanResponse += filteredChunk;

      // live update bot response while streaming
      setMessages((prev) => {
        const withoutTempBot = prev.filter((m) => m.role !== 'bot-temp');
        return [...withoutTempBot, { role: 'bot-temp', text: cleanResponse }];
      });
    };

    const onDone = () => {
      setIsTyping(false);
      setMessages((prev) => {
        const withoutTempBot = prev.filter((m) => m.role !== 'bot-temp');
        return [...withoutTempBot, { role: 'bot', text: cleanResponse }];
      });
      cleanup();
    };

    const onError = (errMsg) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: errMsg || '❌ Failed to get response' },
      ]);
      cleanup();
    };

    const cleanup = () => {
      socket.off('chat_chunk', onChunk);
      socket.off('chat_done', onDone);
      socket.off('chat_error', onError);
      activeListenersRef.current = null;
    };

    // Store references for cleanup
    activeListenersRef.current = { onChunk, onDone, onError };

    // attach listeners
    socket.on('chat_chunk', onChunk);
    socket.on('chat_done', onDone);
    socket.on('chat_error', onError);

    // send to backend
    socket.emit('send_message', { text: sentText });
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border rounded p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-[80%] ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white self-end ml-auto'
                : msg.role === 'bot' || msg.role === 'bot-temp'
                ? 'bg-gray-200 text-black self-start'
                : 'text-red-500 text-sm'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && <p className="text-sm text-gray-500">Bot is typing...</p>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 border rounded p-2"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
