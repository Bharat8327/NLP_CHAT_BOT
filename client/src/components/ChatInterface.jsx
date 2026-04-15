import { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import CustomButton from './CustomButton.jsx';
import { CustomCard } from './CustomCard.jsx';
import FilePreview from './FilePreview.jsx';
import ChatWithVoice from './ChatVoices.jsx';

// 🔊 SpeechControls Component
function SpeechControls({ text }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lang, setLang] = useState('en-US');

  const startSpeaking = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;

    // pick a matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang === lang);
    if (match) u.voice = match;

    u.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
    setIsSpeaking(true);
  };

  const pauseSpeaking = () => {
    window.speechSynthesis.pause();
    setIsSpeaking(false);
  };

  const resumeSpeaking = () => {
    window.speechSynthesis.resume();
    setIsSpeaking(true);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col gap-2 mt-1 text-xs text-white">
      <div className="flex gap-2">
        <button onClick={startSpeaking}>▶️ Start</button>
        <button onClick={pauseSpeaking}>⏸ Pause</button>
        <button onClick={resumeSpeaking}>⏯ Resume</button>
        <button onClick={stopSpeaking}>⏹ Stop</button>
      </div>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="text-black text-xs"
      >
        <option value="en-US">English (US)</option>
        <option value="hi-IN">Hindi</option>
        <option value="es-ES">Spanish</option>
        <option value="fr-FR">French</option>
        <option value="zh-CN">Chinese</option>
        <option value="ar-SA">Arabic</option>
      </select>
    </div>
  );
}

export default function ChatInterface({ currentChatId, onChatChange }) {
  const [messages, setMessages] = useState([]);
  const [chatData, setChatData] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastBotMessage, setLastBotMessage] = useState('');
  const [inputLang, setInputLang] = useState('en-US'); // 🌍 language for sending

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const socketRef = useRef(null);
  const activeListenersRef = useRef(null);

  // Initialize socket inside component lifecycle
  useEffect(() => {
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

  // Send Message
  const handleSend = (overrideText) => {
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim() && uploadedFiles.length === 0) return;

    const socket = socketRef.current;
    if (!socket) return;

    // Clean up any previous active listeners
    if (activeListenersRef.current) {
      socket.off('chat_chunk', activeListenersRef.current.onChunk);
      socket.off('chat_done', activeListenersRef.current.onDone);
      socket.off('chat_error', activeListenersRef.current.onError);
      activeListenersRef.current = null;
    }

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString(),
      files: uploadedFiles.length ? uploadedFiles : undefined,
      lang: inputLang, // 🌍 store language
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    setChatData((p) => ({ ...p, [currentChatId]: updated }));
    onChatChange?.(currentChatId, updated);

    setInputValue('');
    setUploadedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = '44px';

    setIsTyping(true);
    let cleanResponse = '';

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

      cleanup();
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

    socket.on('chat_chunk', onChunk);
    socket.on('chat_done', onDone);
    socket.on('chat_error', onError);

    socket.emit('send_message', {
      text: textToSend,
      lang: inputLang, // 🌍 send language to backend
      files: uploadedFiles.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    });
  };

  // Fixed: directly pass text to handleSend instead of using setTimeout race condition
  const sendVoiceText = (text) => {
    handleSend(text);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
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

              {/* 🔊 Speech controls for bot messages */}
              {m.type.includes('bot') && <SpeechControls text={m.content} />}
            </CustomCard>
          </div>
        ))}
        {isTyping && <p className="text-xs text-gray-400">analyzing...</p>}
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

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type message..."
            className="flex-1 border rounded p-2 resize-none"
            rows={1}
          />

          <CustomButton onClick={() => handleSend()}>➤</CustomButton>

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
