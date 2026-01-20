import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// connect socket
const socket = io(`${import.meta.env.VITE_BACKEND_URL}`); // change to your backend URL

const ChatBot = () => {
  const [messages, setMessages] = useState([]); // store chat messages
  const [input, setInput] = useState(''); // user input
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // cleanup listeners when component unmounts
    return () => {
      socket.off('chat_chunk');
      socket.off('chat_done');
      socket.off('chat_error');
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]); // add user msg to UI

    // reset
    setInput('');
    setIsTyping(true);

    let cleanResponse = '';

    const onChunk = (chunk) => {
      const filteredChunk = chunk.replace(/\\/g, '').trim();
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

      socket.off('chat_chunk', onChunk);
      socket.off('chat_done', onDone);
      socket.off('chat_error', onError);
    };

    const onError = (errMsg) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: errMsg || '❌ Failed to get response' },
      ]);

      socket.off('chat_chunk', onChunk);
      socket.off('chat_done', onDone);
      socket.off('chat_error', onError);
    };

    // attach listeners
    socket.on('chat_chunk', onChunk);
    socket.on('chat_done', onDone);
    socket.on('chat_error', onError);

    // send to backend
    socket.emit('send_message', { text: input });
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
