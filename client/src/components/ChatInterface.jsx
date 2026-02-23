import { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import CustomButton from './CustomButton.jsx';
import { CustomCard } from './CustomCard.jsx';
import FilePreview from './FilePreview.jsx';
import ChatWithVoice from './ChatVoices.jsx';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function ChatInterface({ currentChatId, onChatChange }) {
  const [messages, setMessages] = useState([]);
  const [chatData, setChatData] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastBotMessage, setLastBotMessage] = useState('');

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Load chat messages
  useEffect(() => {
    const defaultMsg = [
      {
        id: '1',
        type: 'bot',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date().toLocaleTimeString(),
      },
    ];

    if (chatData[currentChatId]) setMessages(chatData[currentChatId]);
    else {
      setMessages(defaultMsg);
      setChatData((p) => ({ ...p, [currentChatId]: defaultMsg }));
    }
  }, [currentChatId]);

  // Cleanup socket
  useEffect(() => {
    return () => {
      socket.off('chat_chunk');
      socket.off('chat_done');
      socket.off('chat_error');
    };
  }, []);

  // Send Message
  const handleSend = () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      files: uploadedFiles.length ? uploadedFiles : undefined,
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    setChatData((p) => ({ ...p, [currentChatId]: updated }));
    onChatChange?.(currentChatId, updated);

    setInputValue('');
    setUploadedFiles([]);
    textareaRef.current.style.height = '44px';

    setIsTyping(true);
    let cleanResponse = '';

    // Streaming chunks
    const onChunk = (chunk) => {
      cleanResponse += chunk;
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.type !== 'bot-temp');
        return [
          ...filtered,
          {
            id: 'temp',
            type: 'bot-temp',
            content: cleanResponse,
            timestamp: new Date().toLocaleTimeString(),
          },
        ];
      });
    };

    // Done
    const onDone = () => {
      setIsTyping(false);
      setLastBotMessage(cleanResponse);

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.type !== 'bot-temp');
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            type: 'bot',
            content: cleanResponse,
            timestamp: new Date().toLocaleTimeString(),
          },
        ];
      });

      socket.off('chat_chunk', onChunk);
      socket.off('chat_done', onDone);
      socket.off('chat_error', onError);
    };

    const onError = (err) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          content: err || '❌ AI error',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    };

    socket.on('chat_chunk', onChunk);
    socket.on('chat_done', onDone);
    socket.on('chat_error', onError);

    socket.emit('send_message', {
      text: inputValue,
      files: uploadedFiles.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    });
  };

  // Voice sends text here
  const sendVoiceText = (text) => {
    setInputValue(text);
    setTimeout(handleSend, 200);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    textareaRef.current.style.height = '44px';
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 200) + 'px';
  };

  const handleFileUpload = (e) => {
    setUploadedFiles((p) => [...p, ...Array.from(e.target.files || [])]);
  };

  const removeFile = (i) =>
    setUploadedFiles((p) => p.filter((_, index) => index !== i));

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Messages */}
      <div id="chat-container" className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <CustomCard
              className={`max-w-[70%] p-3 ${
                m.type === 'user'
                  ? 'bg-primary text-white'
                  : m.type.includes('bot')
                    ? 'bg-gray-100 text-black'
                    : 'bg-red-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              <p className="text-xs opacity-50">{m.timestamp}</p>
            </CustomCard>
          </div>
        ))}
        {isTyping && <p className="text-xs text-gray-400">Bot typing...</p>}
      </div>

      {/* Input Area */}
      <div className="border-t p-2 bg-card">
        {uploadedFiles.length > 0 && (
          <FilePreview files={uploadedFiles} onRemove={removeFile} />
        )}

        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            onChange={handleFileUpload}
          />

          <CustomButton onClick={() => fileInputRef.current.click()}>
            📎
          </CustomButton>

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type message..."
            className="flex-1 border rounded p-2 resize-none"
            rows={1}
          />

          <CustomButton onClick={handleSend}>➤</CustomButton>

          {/* 🎤 Voice Component */}
          <ChatWithVoice
            onSendText={sendVoiceText}
            lastBotMessage={lastBotMessage}
          />
        </div>
      </div>
    </div>
  );
}
