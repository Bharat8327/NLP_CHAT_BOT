import { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import CustomButton from './CustomButton';
import { CustomCard } from './CustomCard';
import FilePreview from './FilePreview';

// connect socket
const socket = io(`${import.meta.env.VITE_BACKEND_URL}`); // change to your backend URL

const ChatInterface = ({ currentChatId, onChatChange }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [chatData, setChatData] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Load messages for current chat
  useEffect(() => {
    if (chatData[currentChatId]) {
      setMessages(chatData[currentChatId]);
    } else {
      const defaultMessages = [
        {
          id: '1',
          type: 'bot',
          content: "Hello! I'm your AI assistant. How can I help you today?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ];
      setMessages(defaultMessages);
      setChatData((prev) => ({ ...prev, [currentChatId]: defaultMessages }));
    }
  }, [currentChatId]);

  // cleanup socket listeners
  useEffect(() => {
    return () => {
      socket.off('chat_chunk');
      socket.off('chat_done');
      socket.off('chat_error');
    };
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatData((prev) => ({ ...prev, [currentChatId]: updatedMessages }));
    onChatChange(currentChatId, updatedMessages);

    // reset input
    setInputValue('');
    setUploadedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = '44px';

    // scroll
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);

    // start bot typing
    setIsTyping(true);

    let cleanResponse = '';

    const onChunk = (chunk) => {
      cleanResponse += chunk;
      setMessages((prev) => {
        const withoutTempBot = prev.filter((m) => m.type !== 'bot-temp');
        return [
          ...withoutTempBot,
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
      setMessages((prev) => {
        const withoutTempBot = prev.filter((m) => m.type !== 'bot-temp');
        return [
          ...withoutTempBot,
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

    const onError = (errMsg) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          content: errMsg || '❌ Failed to get response',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      socket.off('chat_chunk', onChunk);
      socket.off('chat_done', onDone);
      socket.off('chat_error', onError);
    };

    // attach listeners
    socket.on('chat_chunk', onChunk);
    socket.on('chat_done', onDone);
    socket.on('chat_error', onError);

    // send message + files to backend
    socket.emit('send_message', {
      text: userMessage.content,
      files: uploadedFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    });
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      <div
        id="chat-container"
        className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <CustomCard
              className={`max-w-[80%] sm:max-w-[70%] p-4 bg-yellow-500 text-black animate-fade-in ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground border-primary/20'
                  : message.type === 'bot' || message.type === 'bot-temp'
                  ? 'bg-card border-border'
                  : 'text-red-500'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.files && message.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-xs p-2 rounded ${
                        message.type === 'user'
                          ? 'bg-primary-foreground/10'
                          : 'bg-muted/50'
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <span>{file.name}</span>
                      <span className="opacity-60">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs mt-2 opacity-70 text-violet-900 ">
                {message.timestamp}
              </p>
            </CustomCard>
          </div>
        ))}
        {isTyping && <p className="text-sm text-gray-500">Bot is typing...</p>}
      </div>

      {/* Input section */}
      <div className="border-t border-border p-2 bg-card">
        {uploadedFiles.length > 0 && (
          <div className="mb-2">
            <FilePreview files={uploadedFiles} onRemove={removeFile} />
          </div>
        )}

        <div className="flex gap-2 items-start">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          <CustomButton
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="h-11 px-3 border-border hover:bg-muted"
            title="Attach files"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </CustomButton>

          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring auto-resize resize-none"
              rows={1}
            />
          </div>

          <CustomButton
            onClick={handleSend}
            disabled={!inputValue.trim() && uploadedFiles.length === 0}
            className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
