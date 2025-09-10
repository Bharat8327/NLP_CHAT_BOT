import { useState, useRef, useEffect } from 'react';
import CustomButton from './CustomButton';
import { CustomCard } from './CustomCard';
import FilePreview from './FilePreview';

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

  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

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

    // Auto-scroll to bottom after adding message
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content:
          "Thank you for your message. I've received it and I'm processing your request.",
        timestamp: new Date().toLocaleTimeString(),
      };
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      setChatData((prev) => ({ ...prev, [currentChatId]: finalMessages }));
      onChatChange(currentChatId, finalMessages);

      // Auto-scroll after bot response
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }, 1000);

    setInputValue('');
    setUploadedFiles([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
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
    <div className="flex-1 flex flex-col h-full bg-background">
      <div
        id="chat-container"
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <CustomCard
              className={`max-w-[70%] p-4 animate-fade-in ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground border-primary/20'
                  : 'bg-card border-border'
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
              <p className={`text-xs mt-2 opacity-70`}>{message.timestamp}</p>
            </CustomCard>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-1 bg-card items-end">
        {uploadedFiles.length > 0 && (
          <div className="mb-4">
            <FilePreview files={uploadedFiles} onRemove={removeFile} />
          </div>
        )}

        <div className="flex gap-1 items-start ">
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
              className="w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-3 bg-input  border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring auto-resize resize-none"
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
